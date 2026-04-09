import type { Candidate, Dimension, Evidence } from "@/features/analysis-run/types";
import { getOpenAIClient } from "@/lib/openai";
import {
  coerceEvidencePayload,
  evidencePayloadSchema
} from "./schema";
import type { EvidenceSourceTask } from "./build-evidence-source-tasks";

type ExtractEvidenceInput = {
  candidate: Candidate;
  dimension: Dimension;
  task: EvidenceSourceTask;
  pageText: string;
};

function buildMockEvidence(input: ExtractEvidenceInput): Evidence[] {
  return [
    {
      candidateId: input.candidate.id,
      dimensionId: input.dimension.id,
      sourceType: input.task.sourceType,
      url: input.task.url,
      excerpt: input.pageText.slice(0, 180),
      extractedValue: `${input.dimension.name} signal from ${input.task.sourceType}`,
      confidence: 0.82,
      capturedAt: new Date().toISOString()
    }
  ];
}

export async function extractEvidence(input: ExtractEvidenceInput) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockEvidence(input);
  }

  const response = await getOpenAIClient().responses.create({
    model: process.env.OPENAI_SEARCH_MODEL ?? process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini",
    instructions:
      "Extract strict evidence records for the given candidate and dimension. Only return evidence grounded in the supplied page text. Return strict JSON only.",
    input: JSON.stringify({
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
    }),
    text: {
      format: {
        type: "json_schema",
        name: "evidence_payload",
        strict: true,
        schema: evidencePayloadSchema
      }
    }
  });

  const evidence = coerceEvidencePayload(JSON.parse(response.output_text));

  if (!evidence) {
    throw new Error("Evidence extraction validation failed.");
  }

  return evidence;
}
