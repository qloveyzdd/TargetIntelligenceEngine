import type { Dimension, GoalCard } from "@/features/analysis-run/types";

export type SearchPlanInput = {
  goal: GoalCard;
  enabledDimensions: Dimension[];
  sameGoalTargetCount: number;
  sourceHintPool: string[];
};

export function buildSearchPlanInput(input: {
  goal: GoalCard;
  dimensions: Dimension[];
}): SearchPlanInput {
  const enabledDimensions = input.dimensions.filter((dimension) => dimension.enabled);
  const sameGoalTargetCount =
    input.goal.currentStage === "idea" ? 1 : input.goal.currentStage === "validation" ? 2 : 3;

  return {
    goal: input.goal,
    enabledDimensions,
    sameGoalTargetCount,
    sourceHintPool: ["official_site", "docs", "pricing", "review"]
  };
}
