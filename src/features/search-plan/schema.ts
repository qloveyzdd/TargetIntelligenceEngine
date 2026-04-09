import type { SearchPlan, SearchPlanItem, SearchPlanMode } from "@/features/analysis-run/types";

const modeValues = ["same_goal", "dimension_leader"] as const;
const statusValues = ["draft", "confirmed"] as const;

export const searchPlanItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    mode: {
      type: "string",
      enum: [...modeValues]
    },
    dimensionId: {
      anyOf: [{ type: "string" }, { type: "null" }]
    },
    query: { type: "string" },
    whatToFind: { type: "string" },
    whyThisSearch: { type: "string" },
    expectedCandidateCount: { type: "number" },
    sourceHints: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "id",
    "mode",
    "dimensionId",
    "query",
    "whatToFind",
    "whyThisSearch",
    "expectedCandidateCount",
    "sourceHints"
  ]
} as const;

export const searchPlanSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      enum: [...statusValues]
    },
    items: {
      type: "array",
      items: searchPlanItemSchema
    },
    confirmedAt: {
      anyOf: [{ type: "string" }, { type: "null" }]
    }
  },
  required: ["status", "items", "confirmedAt"]
} as const;

export const searchPlanDraftSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: searchPlanItemSchema
    }
  },
  required: ["items"]
} as const;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function isMode(value: unknown): value is SearchPlanMode {
  return typeof value === "string" && modeValues.includes(value as SearchPlanMode);
}

function isStatus(value: unknown): value is SearchPlan["status"] {
  return typeof value === "string" && statusValues.includes(value as SearchPlan["status"]);
}

export function coerceSearchPlanItem(value: unknown): SearchPlanItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = normalizeId(typeof raw.id === "string" ? raw.id : "");
  const query = normalizeString(raw.query);
  const whatToFind = normalizeString(raw.whatToFind);
  const whyThisSearch = normalizeString(raw.whyThisSearch);
  const sourceHints = toStringArray(raw.sourceHints);
  const expectedCandidateCount =
    typeof raw.expectedCandidateCount === "number"
      ? raw.expectedCandidateCount
      : Number(raw.expectedCandidateCount);

  if (
    !id ||
    !isMode(raw.mode) ||
    !query ||
    !whatToFind ||
    !whyThisSearch ||
    !Number.isFinite(expectedCandidateCount) ||
    expectedCandidateCount <= 0 ||
    sourceHints.length === 0
  ) {
    return null;
  }

  if (raw.dimensionId !== null && typeof raw.dimensionId !== "string") {
    return null;
  }

  return {
    id,
    mode: raw.mode,
    dimensionId: raw.dimensionId ?? null,
    query,
    whatToFind,
    whyThisSearch,
    expectedCandidateCount,
    sourceHints
  };
}

export function coerceSearchPlanItems(value: unknown): SearchPlanItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.map((item) => coerceSearchPlanItem(item));

  if (items.some((item) => !item)) {
    return null;
  }

  return items as SearchPlanItem[];
}

export function coerceSearchPlan(value: unknown): SearchPlan | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const items = coerceSearchPlanItems(raw.items);

  if (!isStatus(raw.status) || !items) {
    return null;
  }

  if (raw.confirmedAt !== null && typeof raw.confirmedAt !== "string") {
    return null;
  }

  return {
    status: raw.status,
    items,
    confirmedAt: raw.confirmedAt ?? null
  };
}

export function coerceSearchPlanDraftPayload(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  return coerceSearchPlanItems(raw.items);
}
