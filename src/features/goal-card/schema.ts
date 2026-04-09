import type { GoalCard, GoalStage } from "@/features/analysis-run/types";

export const goalStageValues = ["idea", "validation", "mvp", "growth"] as const;

export const goalCardSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    category: { type: "string" },
    jobToBeDone: { type: "string" },
    hardConstraints: {
      type: "array",
      items: { type: "string" }
    },
    softPreferences: {
      type: "array",
      items: { type: "string" }
    },
    currentStage: {
      type: "string",
      enum: [...goalStageValues]
    }
  },
  required: [
    "name",
    "category",
    "jobToBeDone",
    "hardConstraints",
    "softPreferences",
    "currentStage"
  ]
} as const;

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isGoalStage(value: unknown): value is GoalStage {
  return typeof value === "string" && goalStageValues.includes(value as GoalStage);
}

export function coerceGoalCard(value: unknown): GoalCard | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;

  if (
    typeof raw.name !== "string" ||
    typeof raw.category !== "string" ||
    typeof raw.jobToBeDone !== "string" ||
    !isGoalStage(raw.currentStage)
  ) {
    return null;
  }

  return {
    name: raw.name.trim(),
    category: raw.category.trim(),
    jobToBeDone: raw.jobToBeDone.trim(),
    hardConstraints: toStringArray(raw.hardConstraints),
    softPreferences: toStringArray(raw.softPreferences),
    currentStage: raw.currentStage
  };
}
