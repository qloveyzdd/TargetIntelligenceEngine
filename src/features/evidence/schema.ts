import type { Evidence, SourceType } from "@/features/analysis-run/types";

const sourceTypeValues = ["official_site", "docs", "pricing", "review"] as const;

export const evidenceRecordSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidateId: { type: "string" },
    dimensionId: { type: "string" },
    sourceType: {
      type: "string",
      enum: [...sourceTypeValues]
    },
    url: { type: "string" },
    excerpt: { type: "string" },
    extractedValue: { type: "string" },
    confidence: { type: "number" },
    capturedAt: { type: "string" }
  },
  required: [
    "candidateId",
    "dimensionId",
    "sourceType",
    "url",
    "excerpt",
    "extractedValue",
    "confidence",
    "capturedAt"
  ]
} as const;

export const evidencePayloadSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    evidence: {
      type: "array",
      items: evidenceRecordSchema
    }
  },
  required: ["evidence"]
} as const;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  try {
    const url = new URL(value.trim());
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function isSourceType(value: unknown): value is SourceType {
  return typeof value === "string" && sourceTypeValues.includes(value as SourceType);
}

export function coerceEvidenceRecord(value: unknown): Evidence | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const confidence =
    typeof raw.confidence === "number" ? raw.confidence : Number(raw.confidence);
  const candidateId = normalizeString(raw.candidateId);
  const dimensionId = normalizeString(raw.dimensionId);
  const url = normalizeUrl(raw.url);
  const excerpt = normalizeString(raw.excerpt);
  const extractedValue = normalizeString(raw.extractedValue);
  const capturedAt = normalizeString(raw.capturedAt);

  if (
    !candidateId ||
    !dimensionId ||
    !isSourceType(raw.sourceType) ||
    !url ||
    !excerpt ||
    !extractedValue ||
    !capturedAt ||
    !Number.isFinite(confidence)
  ) {
    return null;
  }

  return {
    candidateId,
    dimensionId,
    sourceType: raw.sourceType,
    url,
    excerpt,
    extractedValue,
    confidence: Math.max(0, Math.min(1, confidence)),
    capturedAt
  };
}

export function coerceEvidencePayload(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;

  if (!Array.isArray(raw.evidence)) {
    return null;
  }

  const evidence = raw.evidence.map((item) => coerceEvidenceRecord(item));

  if (evidence.some((item) => !item)) {
    return null;
  }

  return evidence as Evidence[];
}
