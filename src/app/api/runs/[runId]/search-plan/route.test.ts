import { beforeEach, describe, expect, it } from "vitest";
import { createDraftRun, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildInitialDimensions } from "@/features/dimensions/build-initial-dimensions";
import { POST, PATCH } from "./route";

describe("search plan route", () => {
  beforeEach(() => {
    process.env.ANALYSIS_RUN_STORE = "memory";
    process.env.MOCK_OPENAI = "true";
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("generates same_goal and dimension_leader search plan items", async () => {
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
      status: "dimensions_ready",
      dimensions: buildInitialDimensions(goal)
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/search-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({ runId: run.id })
      }
    );
    const payload = (await response.json()) as {
      run?: {
        status: string;
        searchPlan: {
          items: Array<{
            mode: string;
          }>;
        } | null;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.status).toBe("search_plan_ready");
    expect(payload.run?.searchPlan?.items.some((item) => item.mode === "same_goal")).toBe(
      true
    );
    expect(
      payload.run?.searchPlan?.items.some((item) => item.mode === "dimension_leader")
    ).toBe(true);
  });

  it("rejects search plan generation when no enabled dimensions remain", async () => {
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
      status: "dimensions_ready",
      dimensions: buildInitialDimensions(goal).map((dimension) => ({
        ...dimension,
        enabled: false
      }))
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/search-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({ runId: run.id })
      }
    );

    expect(response.status).toBe(400);
  });

  it("confirms a valid search plan payload", async () => {
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
      status: "search_plan_ready",
      dimensions: buildInitialDimensions(goal),
      searchPlan: {
        status: "draft",
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
        confirmedAt: null
      }
    });

    const response = await PATCH(
      new Request("http://localhost/api/runs/test/search-plan", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          searchPlan: {
            status: "draft",
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
            confirmedAt: null
          }
        })
      }),
      {
        params: Promise.resolve({ runId: run.id })
      }
    );
    const payload = (await response.json()) as {
      run?: {
        status: string;
        searchPlan: {
          status: string;
          confirmedAt: string | null;
        } | null;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.status).toBe("search_plan_confirmed");
    expect(payload.run?.searchPlan?.status).toBe("confirmed");
    expect(payload.run?.searchPlan?.confirmedAt).not.toBeNull();
  });
});
