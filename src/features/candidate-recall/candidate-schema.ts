import type { CandidateSource } from "@/features/analysis-run/types";

const sourceTypeValues = ["official_site", "docs", "pricing", "review"] as const;

export type CandidateDraft = {
  name: string;
  officialUrl: string | null;
  strengthDimensions: string[];
  sources: CandidateSource[];
};

export const candidateSourceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sourceType: {
      type: "string",
      enum: [...sourceTypeValues]
    },
    url: { type: "string" }
  },
  required: ["sourceType", "url"]
} as const;

export const candidateDraftSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    officialUrl: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    strengthDimensions: {
      type: "array",
      items: { type: "string" }
    },
    sources: {
      type: "array",
      items: candidateSourceSchema
    }
  },
  required: ["name", "officialUrl", "strengthDimensions", "sources"]
} as const;

export const candidateDraftPayloadSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidates: {
      type: "array",
      items: candidateDraftSchema
    }
  },
  required: ["candidates"]
} as const;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function coerceCandidateSource(value: unknown): CandidateSource | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const url = normalizeUrl(raw.url);

  if (
    !url ||
    typeof raw.sourceType !== "string" ||
    !sourceTypeValues.includes(raw.sourceType as (typeof sourceTypeValues)[number])
  ) {
    return null;
  }

  return {
    sourceType: raw.sourceType as CandidateSource["sourceType"],
    url
  };
}

export function coerceCandidateDraft(value: unknown): CandidateDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const name = normalizeString(raw.name);
  const officialUrl =
    raw.officialUrl === null ? null : normalizeUrl(raw.officialUrl);
  const strengthDimensions = toStringArray(raw.strengthDimensions);

  if (!name) {
    return null;
  }

  if (raw.officialUrl !== null && officialUrl === null) {
    return null;
  }

  if (!Array.isArray(raw.sources)) {
    return null;
  }

  const sources = raw.sources.map((item) => coerceCandidateSource(item));

  if (sources.some((item) => !item)) {
    return null;
  }

  return {
    name,
    officialUrl,
    strengthDimensions,
    sources: sources as CandidateSource[]
  };
}

export function coerceCandidateDraftPayload(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;

  if (!Array.isArray(raw.candidates)) {
    return null;
  }

  const candidates = raw.candidates.map((item) => coerceCandidateDraft(item));

  if (candidates.some((item) => !item)) {
    return null;
  }

  return candidates as CandidateDraft[];
}
