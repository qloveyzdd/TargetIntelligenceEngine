import { beforeEach, describe, expect, it } from "vitest";
import { createDraftRun, updateRunAggregate } from "@/features/analysis-run/repository";
import { GET } from "./route";

describe("handoff route", () => {
  beforeEach(() => {
    process.env.ANALYSIS_RUN_STORE = "memory";
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("returns only the structured handoff payload", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable target intelligence engine."
    });

    await updateRunAggregate(run.id, {
      status: "evidence_ready",
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
          objective: "Validate the threshold.",
          basedOnGaps: ["cost"],
          relatedDimensions: ["cost"],
          referenceProducts: ["Product A"],
          successMetrics: ["Known cost."],
          deliverables: ["Notes"],
          risks: ["Noise"]
        },
        {
          stage: "mvp",
          objective: "Close the core gap.",
          basedOnGaps: ["cost"],
          relatedDimensions: ["cost"],
          referenceProducts: ["Product A"],
          successMetrics: ["Closer gap."],
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

    const response = await GET(new Request("http://localhost/api/runs/test/handoff"), {
      params: Promise.resolve({ runId: run.id })
    });
    const payload = (await response.json()) as {
      handoff?: {
        goalSummary: { name: string };
        stageGoals: Array<{ stage: string }>;
        stageFocuses: Array<{ stage: string; focus: string }>;
        generatedAt: string;
      };
      run?: unknown;
    };

    expect(response.status).toBe(200);
    expect(payload.handoff?.goalSummary.name).toBe("Target Intelligence Engine");
    expect(payload.handoff?.stageGoals).toHaveLength(3);
    expect(payload.handoff?.stageFocuses[0]?.stage).toBe("validation");
    expect(payload.handoff?.generatedAt).toBe("2026-04-10T00:10:00.000Z");
    expect(payload.run).toBeUndefined();
  });

  it("rejects export when stage goals are missing", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable target intelligence engine."
    });

    await updateRunAggregate(run.id, {
      status: "evidence_ready",
      scoring: {
        generatedAt: "2026-04-10T00:10:00.000Z",
        candidateScorecards: [],
        gaps: []
      }
    });

    const response = await GET(new Request("http://localhost/api/runs/test/handoff"), {
      params: Promise.resolve({ runId: run.id })
    });

    expect(response.status).toBe(400);
  });
});
