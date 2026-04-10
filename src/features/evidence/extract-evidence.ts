import type { Candidate, Dimension, Evidence } from "@/features/analysis-run/types";
import {
  getOpenAIClient,
  shouldFallbackToChatCompletions,
  shouldUseChatCompletionsForStructuredJson
} from "@/lib/openai";
import { coerceEvidencePayload, evidencePayloadSchema } from "./schema";
import { assignEvidenceId } from "./assign-evidence-id";
import type { EvidenceSourceTask } from "./build-evidence-source-tasks";

type ExtractEvidenceInput = {
  candidate: Candidate;
  dimension: Dimension;
  task: EvidenceSourceTask;
  pageText: string;
};

function buildMockEvidence(input: ExtractEvidenceInput): Evidence[] {
  const excerpt = input.pageText.slice(0, 180);
  const extractedValue = `${input.dimension.name} signal from ${input.task.sourceType}`;

  return [
    {
      id: assignEvidenceId({
        candidateId: input.candidate.id,
        dimensionId: input.dimension.id,
        sourceType: input.task.sourceType,
        url: input.task.url,
        excerpt,
        extractedValue
      }),
      candidateId: input.candidate.id,
      dimensionId: input.dimension.id,
      sourceType: input.task.sourceType,
      url: input.task.url,
      excerpt,
      extractedValue,
      confidence: 0.82,
      capturedAt: new Date().toISOString()
    }
  ];
}

function getEvidenceModel() {
  return process.env.OPENAI_SEARCH_MODEL ?? process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini";
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Evidence JSON was not found in the model response.");
  }

  return withoutFence.slice(start, end + 1);
}

function parseEvidencePayload(raw: string) {
  const evidence = coerceEvidencePayload(JSON.parse(extractJsonObject(raw)));

  if (!evidence) {
    throw new Error("Evidence extraction validation failed.");
  }

  return evidence;
}

function parseLenientEvidencePayload(
  input: ExtractEvidenceInput,
  raw: string
): Evidence[] {
  const parsed = JSON.parse(extractJsonObject(raw));
  const items = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { evidence?: unknown }).evidence)
      ? (parsed as { evidence: unknown[] }).evidence
      : [];

  const fallbackCapturedAt = new Date().toISOString();
  const evidence = items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const rawItem = item as Record<string, unknown>;
      const excerpt =
        typeof rawItem.excerpt === "string" && rawItem.excerpt.trim()
          ? rawItem.excerpt.trim()
          : typeof rawItem.content === "string" && rawItem.content.trim()
            ? rawItem.content.trim()
            : typeof rawItem.quote === "string" && rawItem.quote.trim()
              ? rawItem.quote.trim()
              : "";
      const extractedValue =
        typeof rawItem.extractedValue === "string" && rawItem.extractedValue.trim()
          ? rawItem.extractedValue.trim()
          : typeof rawItem.value === "string" && rawItem.value.trim()
            ? rawItem.value.trim()
            : excerpt.slice(0, 120);
      const confidence =
        typeof rawItem.confidence === "number"
          ? rawItem.confidence
          : Number(rawItem.confidence ?? 0.72);

      if (!excerpt || !extractedValue || !Number.isFinite(confidence)) {
        return null;
      }

      return {
        id: assignEvidenceId({
          candidateId: input.candidate.id,
          dimensionId: input.dimension.id,
          sourceType: input.task.sourceType,
          url: input.task.url,
          excerpt,
          extractedValue
        }),
        candidateId: input.candidate.id,
        dimensionId: input.dimension.id,
        sourceType: input.task.sourceType,
        url: input.task.url,
        excerpt,
        extractedValue,
        confidence: Math.max(0, Math.min(1, confidence)),
        capturedAt:
          typeof rawItem.capturedAt === "string" && rawItem.capturedAt.trim()
            ? rawItem.capturedAt.trim()
            : fallbackCapturedAt
      } satisfies Evidence;
    })
    .filter((item): item is Evidence => Boolean(item));

  if (evidence.length === 0) {
    throw new Error("Evidence extraction validation failed.");
  }

  return evidence;
}

async function repairEvidencePayloadViaChatCompletions(raw: string) {
  const response = await getOpenAIClient().chat.completions.create({
    model: getEvidenceModel(),
    messages: [
      {
        role: "system",
        content: [
          "Repair the provided invalid JSON into valid JSON.",
          "Return exactly one object with an evidence array.",
          "Keep the original evidence text as much as possible.",
          "Do not add markdown fences or extra explanation."
        ].join(" ")
      },
      {
        role: "user",
        content: raw
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Evidence repair response was empty.");
  }

  return content;
}

function buildStructuredEvidenceInput(input: ExtractEvidenceInput) {
  return {
    candidate: {
      id: input.candidate.id,
      name: input.candidate.name
    },
    dimension: {
      id: input.dimension.id,
      name: input.dimension.name,
      definition: input.dimension.definition,
      evidenceNeeded: input.dimension.evidenceNeeded
    },
    source: input.task,
    pageText: input.pageText.slice(0, 12_000)
  };
}

async function extractEvidenceViaResponses(input: ExtractEvidenceInput) {
  const response = await getOpenAIClient().responses.create({
    model: getEvidenceModel(),
    instructions:
      "Extract strict evidence records for the given candidate and dimension. Only return evidence grounded in the supplied page text. Return strict JSON only.",
    input: JSON.stringify(buildStructuredEvidenceInput(input)),
    text: {
      format: {
        type: "json_schema",
        name: "evidence_payload",
        strict: true,
        schema: evidencePayloadSchema
      }
    }
  });

  return parseEvidencePayload(response.output_text);
}

async function extractEvidenceViaChatCompletions(input: ExtractEvidenceInput) {
  const response = await getOpenAIClient().chat.completions.create({
    model: getEvidenceModel(),
    messages: [
      {
        role: "system",
        content: [
          "Extract evidence records as strict JSON.",
          "Return exactly one object with an evidence array.",
          "Only keep evidence that is directly grounded in the supplied page text.",
          "Each evidence record must include candidateId, dimensionId, sourceType, url, excerpt, extractedValue, confidence, capturedAt.",
          "confidence must be a number between 0 and 1.",
          "Return JSON only and do not wrap it in markdown."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify(buildStructuredEvidenceInput(input))
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Evidence extraction response was empty.");
  }

  try {
    return parseEvidencePayload(content);
  } catch (strictError) {
    try {
      return parseLenientEvidencePayload(input, content);
    } catch {
      const repairedContent = await repairEvidencePayloadViaChatCompletions(content);

      try {
        return parseEvidencePayload(repairedContent);
      } catch {
        try {
          return parseLenientEvidencePayload(input, repairedContent);
        } catch {
          throw strictError;
        }
      }
    }
  }
}

export async function extractEvidence(input: ExtractEvidenceInput) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockEvidence(input);
  }

  if (shouldUseChatCompletionsForStructuredJson(getEvidenceModel())) {
    return extractEvidenceViaChatCompletions(input);
  }

  try {
    return await extractEvidenceViaResponses(input);
  } catch (error) {
    if (!shouldFallbackToChatCompletions(error)) {
      throw error;
    }

    return extractEvidenceViaChatCompletions(input);
  }
}
