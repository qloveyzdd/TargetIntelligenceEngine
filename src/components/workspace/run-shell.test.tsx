import { describe, expect, it, vi } from "vitest";
import { requestRunScoring } from "./run-shell";

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
        error: "Persisted evidence is required before generating scoring."
      })
    })) as unknown as typeof fetch;

    await expect(
      requestRunScoring({
        runId: "run-1",
        fetchImpl
      })
    ).rejects.toThrow("Persisted evidence is required before generating scoring.");
  });
});
