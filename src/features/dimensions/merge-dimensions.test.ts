import { describe, expect, it } from "vitest";
import { coreDimensions } from "./core-dimensions";
import { mergeDimensions } from "./merge-dimensions";

describe("mergeDimensions", () => {
  it("keeps all core dimensions as the stable base", () => {
    const merged = mergeDimensions(coreDimensions, [
      {
        id: "cost",
        name: "Cost",
        weight: 0.4,
        direction: "lower_better",
        definition: "A duplicate core dimension.",
        evidenceNeeded: ["pricing"],
        layer: "domain",
        enabled: true
      }
    ]);

    expect(merged.filter((dimension) => dimension.layer === "core")).toHaveLength(6);
    expect(merged.find((dimension) => dimension.id === "cost")?.layer).toBe("core");
  });

  it("deduplicates repeated dynamic dimensions", () => {
    const merged = mergeDimensions(coreDimensions, [
      {
        id: "private-deployment",
        name: "Private Deployment",
        weight: 0.2,
        direction: "higher_better",
        definition: "Supports self-hosting.",
        evidenceNeeded: ["deployment_mode"],
        layer: "domain",
        enabled: true
      },
      {
        id: "private deployment",
        name: "Private Deployment Fit",
        weight: 0.22,
        direction: "higher_better",
        definition: "Supports regional self-hosting and controlled rollout.",
        evidenceNeeded: ["security", "deployment_mode"],
        layer: "project",
        enabled: true
      }
    ]);

    const privateDeployment = merged.filter(
      (dimension) => dimension.id === "private-deployment"
    );

    expect(privateDeployment).toHaveLength(1);
    expect(privateDeployment[0]?.layer).toBe("project");
    expect(privateDeployment[0]?.evidenceNeeded).toContain("security");
  });
});
