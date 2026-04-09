import type { Dimension, DimensionDirection, DimensionLayer } from "@/features/analysis-run/types";

const directionValues = ["higher_better", "lower_better"] as const;
const layerValues = ["core", "domain", "project"] as const;
const dynamicLayerValues = ["domain", "project"] as const;

const dimensionProperties = {
  id: { type: "string" },
  name: { type: "string" },
  weight: { type: "number" },
  direction: {
    type: "string",
    enum: [...directionValues]
  },
  definition: { type: "string" },
  evidenceNeeded: {
    type: "array",
    items: { type: "string" }
  },
  layer: {
    type: "string",
    enum: [...layerValues]
  },
  enabled: { type: "boolean" }
} as const;

export const dimensionSchema = {
  type: "object",
  additionalProperties: false,
  properties: dimensionProperties,
  required: [
    "id",
    "name",
    "weight",
    "direction",
    "definition",
    "evidenceNeeded",
    "layer",
    "enabled"
  ]
} as const;

export const dynamicDimensionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    dimensions: {
      type: "array",
      items: {
        ...dimensionSchema,
        properties: {
          ...dimensionProperties,
          layer: {
            type: "string",
            enum: [...dynamicLayerValues]
          }
        }
      }
    }
  },
  required: ["dimensions"]
} as const;

function normalizeDimensionId(value: string) {
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

function isDirection(value: unknown): value is DimensionDirection {
  return typeof value === "string" && directionValues.includes(value as DimensionDirection);
}

function isLayer(value: unknown): value is DimensionLayer {
  return typeof value === "string" && layerValues.includes(value as DimensionLayer);
}

function normalizeEnabled(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

export function coerceDimension(
  value: unknown,
  options?: {
    allowCore?: boolean;
  }
): Dimension | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const idSource = typeof raw.id === "string" ? raw.id : name;
  const id = normalizeDimensionId(idSource);
  const weight = typeof raw.weight === "number" ? raw.weight : Number(raw.weight);
  const enabled = normalizeEnabled(raw.enabled);

  if (!name || !id || !Number.isFinite(weight) || weight < 0 || enabled === null) {
    return null;
  }

  if (!isDirection(raw.direction) || !isLayer(raw.layer)) {
    return null;
  }

  if (options?.allowCore === false && raw.layer === "core") {
    return null;
  }

  const definition = typeof raw.definition === "string" ? raw.definition.trim() : "";
  const evidenceNeeded = toStringArray(raw.evidenceNeeded);

  if (!definition || evidenceNeeded.length === 0) {
    return null;
  }

  return {
    id,
    name,
    weight,
    direction: raw.direction,
    definition,
    evidenceNeeded,
    layer: raw.layer,
    enabled
  };
}

export function coerceDimensions(
  value: unknown,
  options?: {
    allowCore?: boolean;
  }
): Dimension[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const dimensions = value.map((item) => coerceDimension(item, options));

  if (dimensions.some((item) => !item)) {
    return null;
  }

  return dimensions as Dimension[];
}

export function coerceDynamicDimensionPayload(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;
  return coerceDimensions(payload.dimensions, { allowCore: false });
}
