import type { AnalysisRun, StageGoal, StageGoalStage } from "@/features/analysis-run/types";

export type StageGoalHandoff = {
  goalSummary: {
    name: string;
    category: string;
    currentStage: string;
    jobToBeDone: string;
  };
  stageGoals: StageGoal[];
  stageFocuses: Array<{
    stage: StageGoalStage;
    focus: string;
  }>;
  generatedAt: string;
};

function buildFocus(stageGoal: StageGoal) {
  const focusDimensions =
    stageGoal.relatedDimensions.length > 0
      ? stageGoal.relatedDimensions.join(", ")
      : "evidence coverage";
  const references =
    stageGoal.referenceProducts.length > 0
      ? ` using ${stageGoal.referenceProducts.join(", ")} as the reference`
      : "";

  return `Focus on ${focusDimensions}${references}.`;
}

export function buildStageGoalHandoff(
  run: Pick<AnalysisRun, "goal" | "inputText" | "scoring" | "stageGoals">
): StageGoalHandoff {
  return {
    goalSummary: {
      name: run.goal?.name ?? "Untitled goal",
      category: run.goal?.category ?? "Uncategorized",
      currentStage: run.goal?.currentStage ?? "unknown",
      jobToBeDone: run.goal?.jobToBeDone ?? run.inputText
    },
    stageGoals: run.stageGoals,
    stageFocuses: run.stageGoals.map((stageGoal) => ({
      stage: stageGoal.stage,
      focus: buildFocus(stageGoal)
    })),
    generatedAt: run.scoring?.generatedAt ?? new Date().toISOString()
  };
}
