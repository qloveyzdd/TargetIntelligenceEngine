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

  return parseEvidencePayload(content);
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
