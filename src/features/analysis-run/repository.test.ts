import { describe, expect, it } from "vitest";
import {
  createDraftRun,
  createInMemoryAnalysisRunStore,
  getRunById,
  updateRunAggregate
} from "./repository";

describe("analysis run repository", () => {
  it("creates a draft run with the five core aggregate fields", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "Build an explainable target intelligence engine.",
        inputNotes: "For product planners."
      },
      store
    );

    expect(run.status).toBe("draft");
    expect(run.goal).toBeNull();
    expect(run.dimensions).toEqual([]);
    expect(run.candidates).toEqual([]);
    expect(run.evidence).toEqual([]);
    expect(run.stageGoals).toEqual([]);
  });

  it("updates a run aggregate and can read it back", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "Build an analysis workspace"
      },
      store
    );

    await updateRunAggregate(
      run.id,
      {
        status: "goal_ready",
        goal: {
          name: "Analysis Workspace",
          category: "AI Product Tool",
          jobToBeDone: "Turn user goals into a structured GoalCard.",
          hardConstraints: ["Open source"],
          softPreferences: ["Easy to use"],
          currentStage: "validation"
        }
      },
      store
    );

    const updated = await getRunById(run.id, store);

    expect(updated?.status).toBe("goal_ready");
    expect(updated?.goal?.name).toBe("Analysis Workspace");
    expect(updated?.goal?.currentStage).toBe("validation");
  });
});
