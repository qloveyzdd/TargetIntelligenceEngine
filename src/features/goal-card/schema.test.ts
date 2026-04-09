import { describe, expect, it } from "vitest";
import { coerceGoalCard, goalCardSchema } from "./schema";

describe("goal card schema", () => {
  it("coerces valid goal cards", () => {
    const goalCard = coerceGoalCard({
      name: "Target Intelligence Engine",
      category: "Product Strategy Tool",
      jobToBeDone: "Turn fuzzy goals into a structured GoalCard.",
      hardConstraints: ["Open source"],
      softPreferences: ["Easy to use"],
      currentStage: "validation"
    });

    expect(goalCard?.name).toBe("Target Intelligence Engine");
    expect(goalCard?.currentStage).toBe("validation");
  });

  it("keeps the required field list stable", () => {
    expect(goalCardSchema.required).toEqual([
      "name",
      "category",
      "jobToBeDone",
      "hardConstraints",
      "softPreferences",
      "currentStage"
    ]);
  });
});
