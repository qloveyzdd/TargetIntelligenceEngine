import { beforeEach, describe, expect, it } from "vitest";
import { createDraftRun, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildInitialDimensions } from "@/features/dimensions/build-initial-dimensions";
import { PATCH } from "./route";

describe("run route", () => {
  beforeEach(() => {
    process.env.ANALYSIS_RUN_STORE = "memory";
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("rebuilds core dimensions and clears searchPlan when the confirmed GoalCard changes", async () => {
    const originalGoal = {
      name: "Target Intelligence Engine",
      category: "AI Product Tool",
      jobToBeDone: "Turn product goals into an explainable analysis workspace.",
      hardConstraints: ["Open source"],
      softPreferences: ["Explainable results"],
      currentStage: "validation" as const
    };
    const updatedGoal = {
      ...originalGoal,
      name: "Target Intelligence Engine Private Edition",
      hardConstraints: ["Open source", "Private deployment"]
    };
    const run = await createDraftRun({
      inputText: originalGoal.jobToBeDone
    });

    await updateRunAggregate(run.id, {
      goal: originalGoal,
      status: "search_plan_confirmed",
      dimensions: buildInitialDimensions(originalGoal).map((dimension) => ({
        ...dimension,
        enabled: dimension.id !== "cost"
      })),
      searchPlan: {
        status: "confirmed",
        items: [
          {
            id: "same-goal-1",
            mode: "same_goal",
            dimensionId: null,
            query: "ai product tool alternatives",
            whatToFind: "Products solving the same goal",
            whyThisSearch: "Need direct comparables",
            expectedCandidateCount: 8,
            sourceHints: ["official_site", "docs"]
          }
        ],
        confirmedAt: "2026-04-10T00:00:00.000Z"
      }
    });

    const response = await PATCH(
      new Request("http://localhost/api/runs/test", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          goal: updatedGoal,
          status: "goal_confirmed"
        })
      }),
      {
        params: Promise.resolve({ runId: run.id })
      }
    );
    const payload = (await response.json()) as {
      run?: {
        status: string;
        dimensions: Array<{
          enabled: boolean;
        }>;
        searchPlan: unknown;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.status).toBe("goal_confirmed");
    expect(payload.run?.dimensions.every((dimension) => dimension.enabled)).toBe(true);
    expect(payload.run?.searchPlan).toBeNull();
  });
});
