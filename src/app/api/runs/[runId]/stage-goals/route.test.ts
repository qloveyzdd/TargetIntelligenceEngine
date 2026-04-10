import { beforeEach, describe, expect, it } from "vitest";
import { createDraftRun, getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { POST } from "./route";

describe("stage goals route", () => {
  beforeEach(() => {
    process.env.ANALYSIS_RUN_STORE = "memory";
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("generates and persists stage goals from persisted scoring gaps", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable target intelligence engine."
    });

    await updateRunAggregate(run.id, {
      status: "evidence_ready",
      goal: {
        name: "Target Intelligence Engine",
        category: "Product intelligence",
        jobToBeDone: "Turn goals into evidence-backed plans.",
        hardConstraints: ["Open source"],
        softPreferences: ["Simple"],
        currentStage: "validation"
      },
      dimensions: [
        {
          id: "cost",
          name: "Cost",
          weight: 0.4,
          direction: "lower_better",
          definition: "Total ownership cost.",
          evidenceNeeded: ["pricing"],
          layer: "core",
          enabled: true
        },
        {
          id: "usability",
          name: "Usability",
          weight: 0.6,
          direction: "higher_better",
          definition: "Ease of use.",
          evidenceNeeded: ["docs"],
          layer: "core",
          enabled: true
        }
      ],
      candidates: [
        {
          id: "product-a",
          name: "Product A",
          matchedModes: ["same_goal"],
          officialUrl: "https://a.example.com",
          strengthDimensions: ["cost"],
          sources: [],
          matchedQueries: [],
          recallRank: 1
        }
      ],
      scoring: {
        generatedAt: "2026-04-10T00:10:00.000Z",
        candidateScorecards: [],
        gaps: [
          {
            dimensionId: "usability",
            status: "known",
            benchmarkCandidateId: "product-a",
            benchmarkCandidateName: "Product A",
            benchmarkMatchedModes: ["same_goal"],
            benchmarkEvidenceIds: ["e-1"],
            benchmarkScore: 84,
            baselineScore: 68,
            gapSize: 16,
            priority: 9.6,
            summary: "Product A leads usability."
          }
        ]
      }
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/stage-goals", {
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
        stageGoals: Array<{ stage: string; basedOnGaps: string[]; referenceProducts: string[] }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.stageGoals).toHaveLength(3);
    expect(payload.run?.stageGoals[0]?.stage).toBe("validation");
    expect(payload.run?.stageGoals[0]?.basedOnGaps).toEqual(["usability"]);
    expect(payload.run?.stageGoals[0]?.referenceProducts).toEqual(["Product A"]);

    const persistedRun = await getRunById(run.id);
    expect(persistedRun?.stageGoals).toHaveLength(3);
  });

  it("returns cached stage goals when already persisted", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable target intelligence engine."
    });

    await updateRunAggregate(run.id, {
      status: "evidence_ready",
      scoring: {
        generatedAt: "2026-04-10T00:10:00.000Z",
        candidateScorecards: [],
        gaps: []
      },
      stageGoals: [
        {
          stage: "validation",
          objective: "Validate the threshold.",
          basedOnGaps: ["cost"],
          relatedDimensions: ["cost"],
          referenceProducts: ["Product A"],
          successMetrics: ["Cost is known."],
          deliverables: ["Notes"],
          risks: ["Noise"]
        },
        {
          stage: "mvp",
          objective: "Close the core gap.",
          basedOnGaps: ["cost"],
          relatedDimensions: ["cost"],
          referenceProducts: ["Product A"],
          successMetrics: ["Closer benchmark."],
          deliverables: ["Scope"],
          risks: ["Bloat"]
        },
        {
          stage: "differentiation",
          objective: "Create an edge.",
          basedOnGaps: ["cost"],
          relatedDimensions: ["cost"],
          referenceProducts: ["Product A"],
          successMetrics: ["Clear edge."],
          deliverables: ["Pitch"],
          risks: ["Premature optimization"]
        }
      ]
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/stage-goals", {
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
        stageGoals: Array<{ objective: string }>;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.stageGoals[0]?.objective).toBe("Validate the threshold.");
  });

  it("rejects generation when scoring is missing", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable target intelligence engine."
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/stage-goals", {
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
