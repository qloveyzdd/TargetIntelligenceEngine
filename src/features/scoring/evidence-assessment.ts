import type { Dimension, Evidence, EvidenceAssessmentStatus } from "@/features/analysis-run/types";
import {
  getOpenAIClient,
  shouldFallbackToChatCompletions,
  shouldUseChatCompletionsForStructuredJson
} from "@/lib/openai";

type EvidenceAssessment = {
  evidenceId: string;
  status: EvidenceAssessmentStatus;
  evidenceScore: number | null;
  summary: string;
};

const evidenceAssessmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      enum: ["supporting", "limiting", "mixed", "insufficient"]
    },
    evidenceScore: {
      anyOf: [{ type: "number" }, { type: "null" }]
    },
    summary: { type: "string" }
  },
  required: ["status", "evidenceScore", "summary"]
} as const;

const positiveKeywords =
  /best|strong|fast|clear|easy|private|self-host|secure|reliable|good|flexible|affordable|low/i;
const negativeKeywords =
  /slow|expensive|limited|weak|poor|high cost|unclear|complex|locked/i;

export function getSourceWeight(sourceType: Evidence["sourceType"]) {
  switch (sourceType) {
    case "official_site":
      return 1;
    case "docs":
      return 0.9;
    case "pricing":
      return 0.85;
    case "review":
      return 0.6;
    default:
      return 0.5;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAssessmentModel() {
  return process.env.OPENAI_SEARCH_MODEL ?? process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini";
}

function coerceEvidenceAssessment(
  evidenceId: string,
  value: unknown
): EvidenceAssessment | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const evidenceScore =
    raw.evidenceScore === null
      ? null
      : typeof raw.evidenceScore === "number"
        ? raw.evidenceScore
        : Number(raw.evidenceScore);

  if (
    typeof raw.status !== "string" ||
    typeof raw.summary !== "string" ||
    (evidenceScore !== null && !Number.isFinite(evidenceScore))
  ) {
    return null;
  }

  return {
    evidenceId,
    status: raw.status as EvidenceAssessmentStatus,
    evidenceScore:
      evidenceScore === null ? null : clamp(Number(evidenceScore.toFixed(3)), 0, 1),
    summary: raw.summary.trim()
  };
}

function buildMockEvidenceAssessment(
  evidence: Evidence,
  dimension: Pick<Dimension, "name" | "direction">
): EvidenceAssessment {
  const text = `${evidence.excerpt} ${evidence.extractedValue}`;
  const sourceWeight = getSourceWeight(evidence.sourceType);

  if (text.trim().length < 12) {
    return {
      evidenceId: evidence.id,
      status: "insufficient",
      evidenceScore: null,
      summary: `${dimension.name} evidence is too thin to score.`
    };
  }

  let score = 0.35 + evidence.confidence * 0.4 + sourceWeight * 0.25;

  if (positiveKeywords.test(text)) {
    score += 0.1;
  }

  if (negativeKeywords.test(text)) {
    score -= 0.16;
  }

  if (dimension.direction === "lower_better" && /low|cheap|affordable|free/i.test(text)) {
    score += 0.06;
  }

  if (dimension.direction === "lower_better" && /expensive|high cost/i.test(text)) {
    score -= 0.08;
  }

  const boundedScore = clamp(Number(score.toFixed(3)), 0.05, 0.98);
  const hasPositive = positiveKeywords.test(text);
  const hasNegative = negativeKeywords.test(text);

  return {
    evidenceId: evidence.id,
    status: hasPositive && hasNegative ? "mixed" : hasNegative ? "limiting" : "supporting",
    evidenceScore: boundedScore,
    summary: `${dimension.name} signal from ${evidence.sourceType} evidence.`
  };
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
    throw new Error("Evidence assessment JSON was not found in the model response.");
  }

  return withoutFence.slice(start, end + 1);
}

function parseEvidenceAssessment(evidenceId: string, raw: string) {
  const assessment = coerceEvidenceAssessment(
    evidenceId,
    JSON.parse(extractJsonObject(raw))
  );

  if (!assessment) {
    throw new Error("Evidence assessment validation failed.");
  }

  return assessment;
}

function buildAssessmentInput(input: {
  evidence: Evidence;
  dimension: Pick<Dimension, "id" | "name" | "direction" | "definition">;
}) {
  return {
    dimension: input.dimension,
    evidence: {
      id: input.evidence.id,
      sourceType: input.evidence.sourceType,
      url: input.evidence.url,
      excerpt: input.evidence.excerpt,
      extractedValue: input.evidence.extractedValue,
      confidence: input.evidence.confidence
    }
  };
}

async function assessEvidenceViaResponses(input: {
  evidence: Evidence;
  dimension: Pick<Dimension, "id" | "name" | "direction" | "definition">;
}) {
  const response = await getOpenAIClient().responses.create({
    model: getAssessmentModel(),
    instructions:
      "Assess a single evidence record for one dimension. Return strict JSON only. If the evidence is insufficient, return status=insufficient and evidenceScore=null.",
    input: JSON.stringify(buildAssessmentInput(input)),
    text: {
      format: {
        type: "json_schema",
        name: "evidence_assessment",
        strict: true,
        schema: evidenceAssessmentSchema
      }
    }
  });

  return parseEvidenceAssessment(input.evidence.id, response.output_text);
}

async function assessEvidenceViaChatCompletions(input: {
  evidence: Evidence;
  dimension: Pick<Dimension, "id" | "name" | "direction" | "definition">;
}) {
  const response = await getOpenAIClient().chat.completions.create({
    model: getAssessmentModel(),
    messages: [
      {
        role: "system",
        content: [
          "Assess a single evidence record for one dimension as strict JSON.",
          "Return exactly one object with status, evidenceScore, summary.",
          "status must be one of supporting, limiting, mixed, insufficient.",
          "If the evidence is insufficient, set evidenceScore to null.",
          "Return JSON only and do not wrap it in markdown."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify(buildAssessmentInput(input))
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Evidence assessment response was empty.");
  }

  return parseEvidenceAssessment(input.evidence.id, content);
}

export async function assessEvidence(input: {
  evidence: Evidence;
  dimension: Pick<Dimension, "id" | "name" | "direction" | "definition">;
}) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockEvidenceAssessment(input.evidence, input.dimension);
  }

  if (shouldUseChatCompletionsForStructuredJson(getAssessmentModel())) {
    return assessEvidenceViaChatCompletions(input);
  }

  try {
    return await assessEvidenceViaResponses(input);
  } catch (error) {
    if (!shouldFallbackToChatCompletions(error)) {
      throw error;
    }

    return assessEvidenceViaChatCompletions(input);
  }
}
