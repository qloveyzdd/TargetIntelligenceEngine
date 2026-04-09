import { describe, expect, it } from "vitest";
import { buildInitialDimensions } from "./build-initial-dimensions";

describe("buildInitialDimensions", () => {
  it("returns six normalized core dimensions", () => {
    const dimensions = buildInitialDimensions({
      name: "Target Intelligence Engine",
      category: "Product Planning Tool",
      jobToBeDone: "Help teams compare products and plan milestones.",
      hardConstraints: ["Open source"],
      softPreferences: ["Easy to use"],
      currentStage: "validation"
    });

    expect(dimensions).toHaveLength(6);
    expect(dimensions.every((dimension) => dimension.layer === "core")).toBe(true);

    const totalWeight = dimensions.reduce((sum, dimension) => sum + dimension.weight, 0);

    expect(totalWeight).toBeCloseTo(1, 3);
  });

  it("raises compliance weight when regulated deployment needs appear", () => {
    const dimensions = buildInitialDimensions({
      name: "Secure AI Workspace",
      category: "AI Tooling",
      jobToBeDone: "Support private deployment in a regulated environment.",
      hardConstraints: ["Private deployment", "Security review"],
      softPreferences: ["Reliable operations"],
      currentStage: "mvp"
    });

    const compliance = dimensions.find((dimension) => dimension.id === "compliance");
    const ecosystem = dimensions.find((dimension) => dimension.id === "ecosystem");

    expect(compliance?.weight).toBeGreaterThan(ecosystem?.weight ?? 0);
  });
});
