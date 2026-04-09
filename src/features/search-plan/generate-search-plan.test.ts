import { describe, expect, it } from "vitest";
import { buildSearchPlanInput } from "./build-search-plan-input";
import { generateSearchPlan } from "./generate-search-plan";

describe("generateSearchPlan", () => {
  it("returns same_goal and dimension_leader items in mock mode", async () => {
    process.env.MOCK_OPENAI = "true";

    const items = await generateSearchPlan(
      buildSearchPlanInput({
        goal: {
          name: "Target Intelligence Engine",
          category: "AI Product Tool",
          jobToBeDone: "Turn fuzzy product goals into a structured analysis plan.",
          hardConstraints: ["Open source"],
          softPreferences: ["Explainable results"],
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
            id: "private-deployment",
            name: "Private Deployment",
            weight: 0.3,
            direction: "higher_better",
            definition: "Supports self-hosting.",
            evidenceNeeded: ["deployment_mode"],
            layer: "project",
            enabled: true
          },
          {
            id: "multilingual",
            name: "Multilingual",
            weight: 0.3,
            direction: "higher_better",
            definition: "Supports multiple languages.",
            evidenceNeeded: ["docs"],
            layer: "project",
            enabled: false
          }
        ]
      })
    );

    expect(items.some((item) => item.mode === "same_goal")).toBe(true);
    expect(items.some((item) => item.mode === "dimension_leader")).toBe(true);
    expect(items.some((item) => item.dimensionId === "multilingual")).toBe(false);
    expect(items.every((item) => item.expectedCandidateCount > 0)).toBe(true);
  });
});
