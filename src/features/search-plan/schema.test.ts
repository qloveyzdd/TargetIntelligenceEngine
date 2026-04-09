import { describe, expect, it } from "vitest";
import {
  coerceSearchPlan,
  coerceSearchPlanDraftPayload,
  searchPlanSchema
} from "./schema";

describe("search plan schema", () => {
  it("coerces a valid search plan", () => {
    const searchPlan = coerceSearchPlan({
      status: "draft",
      items: [
        {
          id: "same goal",
          mode: "same_goal",
          dimensionId: null,
          query: "product planning intelligence engine",
          whatToFind: "Products solving the same planning goal",
          whyThisSearch: "Need direct comparables",
          expectedCandidateCount: 8,
          sourceHints: ["official_site", "docs"]
        }
      ],
      confirmedAt: null
    });

    expect(searchPlan?.items[0]?.id).toBe("same-goal");
    expect(searchPlan?.status).toBe("draft");
  });

  it("rejects invalid draft payloads", () => {
    const draft = coerceSearchPlanDraftPayload({
      items: [
        {
          id: "same-goal",
          mode: "same_goal",
          query: "missing fields"
        }
      ]
    });

    expect(draft).toBeNull();
  });

  it("keeps the mode enum stable", () => {
    const modeEnum = searchPlanSchema.properties.items.items.properties.mode.enum;

    expect(modeEnum).toEqual(["same_goal", "dimension_leader"]);
  });
});
