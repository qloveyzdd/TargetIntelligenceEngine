import { describe, expect, it } from "vitest";
import { generateDynamicDimensions } from "./generate-dynamic-dimensions";

describe("generateDynamicDimensions", () => {
  it("returns only domain and project dimensions in mock mode", async () => {
    process.env.MOCK_OPENAI = "true";

    const dimensions = await generateDynamicDimensions({
      goal: {
        name: "Target Intelligence Engine",
        category: "AI Product Tool",
        jobToBeDone: "Turn fuzzy product goals into an evidence-backed analysis workspace.",
        hardConstraints: ["Open source", "Private deployment later"],
        softPreferences: ["Explainable results", "Small team friendly"],
        currentStage: "validation"
      },
      coreDimensions: []
    });

    expect(dimensions.length).toBeGreaterThanOrEqual(3);
    expect(dimensions.every((dimension) => dimension.layer !== "core")).toBe(true);
    expect(dimensions.every((dimension) => dimension.enabled)).toBe(true);
  });
});
