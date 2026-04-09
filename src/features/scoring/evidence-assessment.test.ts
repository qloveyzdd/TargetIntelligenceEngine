import { beforeEach, describe, expect, it } from "vitest";
import { assessEvidence, getSourceWeight } from "./evidence-assessment";

describe("evidence assessment", () => {
  beforeEach(() => {
    process.env.MOCK_OPENAI = "true";
  });

  it("returns source weights with official sources ranked highest", () => {
    expect(getSourceWeight("official_site")).toBeGreaterThan(getSourceWeight("review"));
    expect(getSourceWeight("docs")).toBeGreaterThan(getSourceWeight("review"));
  });

  it("builds a deterministic mock assessment for evidence", async () => {
    const assessment = await assessEvidence({
      evidence: {
        id: "evi-cost-1",
        candidateId: "openai-responses",
        dimensionId: "cost",
        sourceType: "pricing",
        url: "https://platform.openai.com/pricing",
        excerpt: "Affordable pay-as-you-go pricing for builders.",
        extractedValue: "pay-as-you-go",
        confidence: 0.82,
        capturedAt: "2026-04-10T00:00:00.000Z"
      },
      dimension: {
        id: "cost",
        name: "Cost",
        direction: "lower_better",
        definition: "Total ownership cost."
      }
    });

    expect(assessment.evidenceId).toBe("evi-cost-1");
    expect(assessment.evidenceScore).not.toBeNull();
    expect(assessment.status).toBe("supporting");
  });

  it("marks very thin evidence as insufficient", async () => {
    const assessment = await assessEvidence({
      evidence: {
        id: "evi-cost-2",
        candidateId: "openai-responses",
        dimensionId: "cost",
        sourceType: "review",
        url: "https://example.com/review",
        excerpt: "ok",
        extractedValue: "ok",
        confidence: 0.2,
        capturedAt: "2026-04-10T00:00:00.000Z"
      },
      dimension: {
        id: "cost",
        name: "Cost",
        direction: "lower_better",
        definition: "Total ownership cost."
      }
    });

    expect(assessment.status).toBe("insufficient");
    expect(assessment.evidenceScore).toBeNull();
  });
});
