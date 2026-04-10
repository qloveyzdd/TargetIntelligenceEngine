import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  requestRunStageGoals,
  requestStageGoalHandoff,
  StageGoalsPanel
} from "./stage-goals-panel";

describe("StageGoalsPanel", () => {
  it("renders persisted stage goals and export actions", () => {
    const markup = renderToStaticMarkup(
      <StageGoalsPanel
        run={{
          id: "run-1",
          status: "evidence_ready",
          inputText: "Build an explainable target intelligence engine.",
          inputNotes: null,
          goal: null,
          dimensions: [],
          searchPlan: null,
          candidates: [],
          evidence: [],
          scoring: {
            generatedAt: "2026-04-10T00:00:00.000Z",
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
          ],
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z"
        }}
        onRunChanged={vi.fn()}
      />
    );

    expect(markup).toContain("Preview handoff");
    expect(markup).toContain("Copy handoff");
    expect(markup).toContain("Validate the threshold.");
  });

  it("posts to the stage-goals route and returns the persisted run", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        run: {
          id: "run-1",
          status: "evidence_ready",
          inputText: "Build an explainable target intelligence engine.",
          inputNotes: null,
          goal: null,
          dimensions: [],
          searchPlan: null,
          candidates: [],
          evidence: [],
          scoring: {
            generatedAt: "2026-04-10T00:00:00.000Z",
            candidateScorecards: [],
            gaps: []
          },
          stageGoals: [],
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z"
        }
      })
    })) as unknown as typeof fetch;

    const run = await requestRunStageGoals({
      runId: "run-1",
      fetchImpl
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/runs/run-1/stage-goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        forceRegenerate: false
      })
    });
    expect(run.id).toBe("run-1");
  });

  it("loads the structured handoff payload", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        handoff: {
          goalSummary: {
            name: "Target Intelligence Engine",
            category: "Product intelligence",
            currentStage: "validation",
            jobToBeDone: "Turn goals into evidence-backed stage plans."
          },
          stageGoals: [],
          stageFocuses: [],
          generatedAt: "2026-04-10T00:00:00.000Z"
        }
      })
    })) as unknown as typeof fetch;

    const handoff = await requestStageGoalHandoff({
      runId: "run-1",
      fetchImpl
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/runs/run-1/handoff", {
      method: "GET"
    });
    expect(handoff.goalSummary.name).toBe("Target Intelligence Engine");
  });
});
