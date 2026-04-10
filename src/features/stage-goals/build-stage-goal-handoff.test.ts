import { describe, expect, it } from "vitest";
import { buildStageGoalHandoff } from "./build-stage-goal-handoff";

describe("buildStageGoalHandoff", () => {
  it("formats persisted stage goals into a stable handoff payload", () => {
    const handoff = buildStageGoalHandoff({
      inputText: "Build an evidence-first target intelligence engine.",
      goal: {
        name: "Target Intelligence Engine",
        category: "Product intelligence",
        jobToBeDone: "Turn goals into evidence-backed stage plans.",
        hardConstraints: ["Open source"],
        softPreferences: ["Simple"],
        currentStage: "validation"
      },
      scoring: {
        generatedAt: "2026-04-10T00:10:00.000Z",
        candidateScorecards: [],
        gaps: []
      },
      stageGoals: [
        {
          stage: "validation",
          objective: "Validate the cost threshold.",
          basedOnGaps: ["cost"],
          relatedDimensions: ["cost"],
          referenceProducts: ["Product A"],
          successMetrics: ["Cost is known."],
          deliverables: ["Notes"],
          risks: ["Noise"]
        }
      ]
    });

    expect(handoff.goalSummary.name).toBe("Target Intelligence Engine");
    expect(handoff.stageGoals).toHaveLength(1);
    expect(handoff.stageFocuses[0]?.focus).toContain("cost");
    expect(handoff.generatedAt).toBe("2026-04-10T00:10:00.000Z");
  });
});
