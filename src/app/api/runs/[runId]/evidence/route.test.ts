import { beforeEach, describe, expect, it } from "vitest";
import { createDraftRun, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildInitialDimensions } from "@/features/dimensions/build-initial-dimensions";
import { POST } from "./route";

describe("evidence route", () => {
  beforeEach(() => {
    process.env.ANALYSIS_RUN_STORE = "memory";
    process.env.MOCK_OPENAI = "true";
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("generates persisted evidence from top candidates", async () => {
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
      status: "candidates_ready",
      dimensions: buildInitialDimensions(goal),
      candidates: [
        {
          id: "productboard-com",
          name: "Productboard",
          matchedModes: ["same_goal"],
          officialUrl: "https://www.productboard.com",
          strengthDimensions: ["usability"],
          sources: [
            {
              sourceType: "official_site",
              url: "https://www.productboard.com"
            }
          ],
          matchedQueries: ["same goal tools"],
          recallRank: 1
        }
      ]
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/evidence", {
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
        evidence: Array<{
          candidateId: string;
          sourceType: string;
        }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.status).toBe("evidence_ready");
    expect(payload.run?.evidence.length).toBeGreaterThan(0);
    expect(payload.run?.evidence[0]?.candidateId).toBe("productboard-com");
  });

  it("rejects evidence generation when candidates are missing", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable analysis workspace."
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/evidence", {
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
