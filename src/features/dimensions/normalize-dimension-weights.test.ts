import { describe, expect, it } from "vitest";
import { normalizeDimensionWeights } from "./normalize-dimension-weights";

describe("normalizeDimensionWeights", () => {
  it("normalizes only enabled dimensions to 1", () => {
    const dimensions = normalizeDimensionWeights([
      {
        id: "cost",
        name: "Cost",
        weight: 0.3,
        direction: "lower_better",
        definition: "Pricing and scaling cost.",
        evidenceNeeded: ["pricing"],
        layer: "core",
        enabled: true
      },
      {
        id: "private-deployment",
        name: "Private Deployment",
        weight: 0.4,
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
    ]);

    const enabledTotal = dimensions
      .filter((dimension) => dimension.enabled)
      .reduce((sum, dimension) => sum + dimension.weight, 0);

    expect(enabledTotal).toBeCloseTo(1, 3);
    expect(dimensions.find((dimension) => dimension.id === "multilingual")?.weight).toBe(0.3);
  });

  it("falls back to equal weights when enabled weights are zero", () => {
    const dimensions = normalizeDimensionWeights([
      {
        id: "cost",
        name: "Cost",
        weight: 0,
        direction: "lower_better",
        definition: "Pricing and scaling cost.",
        evidenceNeeded: ["pricing"],
        layer: "core",
        enabled: true
      },
      {
        id: "speed",
        name: "Speed",
        weight: 0,
        direction: "higher_better",
        definition: "Response speed.",
        evidenceNeeded: ["latency"],
        layer: "domain",
        enabled: true
      }
    ]);

    expect(dimensions[0]?.weight).toBeCloseTo(0.5, 3);
    expect(dimensions[1]?.weight).toBeCloseTo(0.5, 3);
  });
});
