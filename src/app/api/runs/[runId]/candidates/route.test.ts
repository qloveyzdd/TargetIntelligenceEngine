import { beforeEach, describe, expect, it } from "vitest";
import { createDraftRun, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildInitialDimensions } from "@/features/dimensions/build-initial-dimensions";
import { POST } from "./route";

describe("candidates route", () => {
  beforeEach(() => {
    process.env.ANALYSIS_RUN_STORE = "memory";
    process.env.MOCK_OPENAI = "true";
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("generates persisted candidates from a confirmed search plan", async () => {
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
            query: "target intelligence alternatives",
            whatToFind: "Products solving the same goal",
            whyThisSearch: "Need direct comparables",
            expectedCandidateCount: 8,
            sourceHints: ["official_site", "docs"]
          },
          {
            id: "leader-cost",
            mode: "dimension_leader",
            dimensionId: "cost",
            query: "best low cost tools",
            whatToFind: "Cost leaders",
            whyThisSearch: "Need low-cost benchmarks",
            expectedCandidateCount: 6,
            sourceHints: ["official_site", "pricing"]
          }
        ],
        confirmedAt: "2026-04-10T00:00:00.000Z"
      }
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/candidates", {
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
        candidates: Array<{
          matchedModes: string[];
          recallRank: number;
        }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.status).toBe("candidates_ready");
    expect(payload.run?.candidates.length).toBeGreaterThan(0);
    expect(payload.run?.candidates[0]?.recallRank).toBe(1);
    expect(
      payload.run?.candidates.some((candidate) =>
        candidate.matchedModes.includes("same_goal")
      )
    ).toBe(true);
  });

  it("rejects candidate generation without a confirmed search plan", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable analysis workspace."
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/candidates", {
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
});
