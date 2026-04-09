import { beforeEach, describe, expect, it } from "vitest";
import { createDraftRun, getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildInitialDimensions } from "@/features/dimensions/build-initial-dimensions";
import { PATCH, POST } from "./route";

describe("dimensions route", () => {
  beforeEach(() => {
    process.env.ANALYSIS_RUN_STORE = "memory";
    process.env.MOCK_OPENAI = "true";
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("generates dynamic dimensions on top of the core set", async () => {
    const goal = {
      name: "Target Intelligence Engine",
      category: "AI Product Tool",
      jobToBeDone: "Turn product goals into an explainable analysis workspace.",
      hardConstraints: ["Open source"],
      softPreferences: ["Explainable results"],
      currentStage: "validation" as const
    };
    const run = await createDraftRun({
      inputText: goal.jobToBeDone
    });

    await updateRunAggregate(run.id, {
      goal,
      status: "goal_confirmed",
      dimensions: buildInitialDimensions(goal)
    });

    const response = await POST(new Request("http://localhost/api/runs/test/dimensions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }), {
      params: Promise.resolve({ runId: run.id })
    });
    const payload = (await response.json()) as {
      run?: {
        dimensions: Array<{
          layer: string;
        }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.dimensions.some((dimension) => dimension.layer === "project")).toBe(
      true
    );
  });

  it("rejects invalid dimension payloads", async () => {
    const goal = {
      name: "Target Intelligence Engine",
      category: "AI Product Tool",
      jobToBeDone: "Turn product goals into an explainable analysis workspace.",
      hardConstraints: ["Open source"],
      softPreferences: ["Explainable results"],
      currentStage: "validation" as const
    };
    const run = await createDraftRun({
      inputText: goal.jobToBeDone
    });

    await updateRunAggregate(run.id, {
      goal,
      status: "goal_confirmed",
      dimensions: buildInitialDimensions(goal)
    });

    const response = await PATCH(new Request("http://localhost/api/runs/test/dimensions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        dimensions: [
          {
            id: "cost"
          }
        ]
      })
    }), {
      params: Promise.resolve({ runId: run.id })
    });

    expect(response.status).toBe(400);

    const storedRun = await getRunById(run.id);

    expect(storedRun?.status).toBe("goal_confirmed");
  });

  it("clears the stale searchPlan when dimensions are confirmed again", async () => {
    const goal = {
      name: "Target Intelligence Engine",
      category: "AI Product Tool",
      jobToBeDone: "Turn product goals into an explainable analysis workspace.",
      hardConstraints: ["Open source"],
      softPreferences: ["Explainable results"],
      currentStage: "validation" as const
    };
    const run = await createDraftRun({
      inputText: goal.jobToBeDone
    });

    await updateRunAggregate(run.id, {
      goal,
      status: "search_plan_confirmed",
      dimensions: buildInitialDimensions(goal),
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
      new Request("http://localhost/api/runs/test/dimensions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dimensions: buildInitialDimensions(goal).map((dimension) =>
            dimension.id === "cost"
              ? {
                  ...dimension,
                  weight: 0.4
                }
              : dimension
          )
        })
      }),
      {
        params: Promise.resolve({ runId: run.id })
      }
    );
    const payload = (await response.json()) as {
      run?: {
        status: string;
        searchPlan: unknown;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.status).toBe("dimensions_ready");
    expect(payload.run?.searchPlan).toBeNull();
  });
});
