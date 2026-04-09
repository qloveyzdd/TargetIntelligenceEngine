import { describe, expect, it } from "vitest";
import {
  coerceDimension,
  coerceDimensions,
  coerceDynamicDimensionPayload,
  dynamicDimensionSchema
} from "./dimension-schema";

describe("dimension schema", () => {
  it("coerces a valid editable dimension", () => {
    const dimension = coerceDimension({
      id: "private deployment",
      name: "Private Deployment",
      weight: 0.24,
      direction: "higher_better",
      definition: "How well the product supports self-hosting.",
      evidenceNeeded: ["deployment_mode", "security"],
      layer: "project",
      enabled: true
    });

    expect(dimension?.id).toBe("private-deployment");
    expect(dimension?.layer).toBe("project");
    expect(dimension?.enabled).toBe(true);
  });

  it("rejects invalid dimension arrays", () => {
    const dimensions = coerceDimensions([
      {
        id: "cost",
        name: "Cost",
        weight: 0.5,
        direction: "lower_better",
        definition: "Pricing and expansion cost.",
        evidenceNeeded: ["pricing"],
        layer: "core"
      }
    ]);

    expect(dimensions).toBeNull();
  });

  it("rejects core dimensions in the dynamic payload", () => {
    const payload = coerceDynamicDimensionPayload({
      dimensions: [
        {
          id: "cost",
          name: "Cost",
          weight: 0.2,
          direction: "lower_better",
          definition: "Pricing and expansion cost.",
          evidenceNeeded: ["pricing"],
          layer: "core",
          enabled: true
        }
      ]
    });

    expect(payload).toBeNull();
  });

  it("keeps the dynamic layer enum stable", () => {
    const layerEnum = dynamicDimensionSchema.properties.dimensions.items.properties.layer.enum;

    expect(layerEnum).toEqual(["domain", "project"]);
  });
});
