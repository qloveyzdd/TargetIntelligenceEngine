import { describe, expect, it } from "vitest";
import { createInMemoryAnalysisRunStore, createDraftRun, getRunById, updateRunAggregate } from "./repository";

describe("analysis run repository", () => {
  it("creates a draft run with the five core aggregate fields", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "做一个可解释的目标 intelligence engine",
        inputNotes: "面向产品负责人"
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
        inputText: "做一个分析工作台"
      },
      store
    );

    await updateRunAggregate(
      run.id,
      {
        status: "goal_ready",
        goal: {
          name: "分析工作台",
          category: "AI Product Tool",
          jobToBeDone: "帮助团队把目标拆成结构化 GoalCard",
          hardConstraints: ["开源"],
          softPreferences: ["易用"],
          currentStage: "validation"
        }
      },
      store
    );

    const updated = await getRunById(run.id, store);

    expect(updated?.status).toBe("goal_ready");
    expect(updated?.goal?.name).toBe("分析工作台");
    expect(updated?.goal?.currentStage).toBe("validation");
  });
});
