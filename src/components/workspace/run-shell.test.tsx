import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RunShell, requestRunScoring } from "./run-shell";

describe("requestRunScoring", () => {
  it("posts to the scoring route and returns the persisted run", async () => {
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

    const run = await requestRunScoring({
      runId: "run-1",
      fetchImpl
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/runs/run-1/scoring", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        forceRegenerate: false
      })
    });
    expect(run.scoring?.generatedAt).toBe("2026-04-10T00:00:00.000Z");
  });

  it("throws when the scoring route returns an error", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "生成评分前，必须先有已保存的证据。"
      })
    })) as unknown as typeof fetch;

    await expect(
      requestRunScoring({
        runId: "run-1",
        fetchImpl
      })
    ).rejects.toThrow("生成评分前，必须先有已保存的证据。");
  });

  it("mounts the stage goals section once scoring exists", () => {
    const markup = renderToStaticMarkup(
      <RunShell
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
          stageGoals: [],
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z"
        }}
      />
    );

    expect(markup).toContain("阶段目标与交接输出");
    expect(markup).toContain("生成阶段目标");
  });
});
