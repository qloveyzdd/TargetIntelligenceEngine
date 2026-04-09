import type { Dimension, GoalCard } from "@/features/analysis-run/types";
import { coreDimensions } from "./core-dimensions";

function roundWeight(value: number) {
  return Number(value.toFixed(3));
}

function collectGoalText(goal: GoalCard) {
  return [
    goal.name,
    goal.category,
    goal.jobToBeDone,
    ...goal.hardConstraints,
    ...goal.softPreferences
  ]
    .join(" ")
    .toLowerCase();
}

function deriveWeightHints(goal: GoalCard) {
  const goalText = collectGoalText(goal);
  const hints = new Map<string, number>();

  if (goal.currentStage === "idea" || goal.currentStage === "validation") {
    hints.set("cost", 0.02);
    hints.set("usability", 0.02);
  }

  if (/(private|self-host|on-prem|security|compliance|regulated)/.test(goalText)) {
    hints.set("compliance", (hints.get("compliance") ?? 0) + 0.05);
  }

  if (/(latency|realtime|real-time|speed|performance)/.test(goalText)) {
    hints.set("performance", (hints.get("performance") ?? 0) + 0.04);
  }

  if (/(budget|cheap|low cost|affordable|small team)/.test(goalText)) {
    hints.set("cost", (hints.get("cost") ?? 0) + 0.04);
  }

  return hints;
}

export function buildInitialDimensions(goal: GoalCard): Dimension[] {
  const hints = deriveWeightHints(goal);
  const hintedTotal = coreDimensions.reduce(
    (sum, dimension) => sum + dimension.weight + (hints.get(dimension.id) ?? 0),
    0
  );

  const normalized = coreDimensions.map((dimension) => ({
    ...dimension,
    evidenceNeeded: [...dimension.evidenceNeeded],
    weight: roundWeight(
      (dimension.weight + (hints.get(dimension.id) ?? 0)) / hintedTotal
    )
  }));

  const roundedTotal = normalized.reduce((sum, dimension) => sum + dimension.weight, 0);
  const adjustment = roundWeight(1 - roundedTotal);

  if (adjustment !== 0 && normalized.length > 0) {
    const lastDimension = normalized[normalized.length - 1];
    normalized[normalized.length - 1] = {
      ...lastDimension,
      weight: roundWeight(lastDimension.weight + adjustment)
    };
  }

  return normalized;
}
