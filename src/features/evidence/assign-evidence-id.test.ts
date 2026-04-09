import { describe, expect, it } from "vitest";
import { assignEvidenceId } from "./assign-evidence-id";

describe("assignEvidenceId", () => {
  it("creates a stable id for the same evidence identity", () => {
    const left = assignEvidenceId({
      candidateId: "productboard-com",
      dimensionId: "usability",
      sourceType: "official_site",
      url: "https://www.productboard.com/#hero",
      excerpt: "Designed to align teams.",
      extractedValue: "alignment workflow"
    });
    const right = assignEvidenceId({
      candidateId: "productboard-com",
      dimensionId: "usability",
      sourceType: "official_site",
      url: "https://www.productboard.com",
      excerpt: "Designed   to align teams.",
      extractedValue: "alignment workflow"
    });

    expect(left).toBe(right);
  });

  it("changes the id when the evidence identity changes", () => {
    const left = assignEvidenceId({
      candidateId: "productboard-com",
      dimensionId: "usability",
      sourceType: "official_site",
      url: "https://www.productboard.com",
      excerpt: "Designed to align teams.",
      extractedValue: "alignment workflow"
    });
    const right = assignEvidenceId({
      candidateId: "productboard-com",
      dimensionId: "cost",
      sourceType: "pricing",
      url: "https://www.productboard.com/pricing",
      excerpt: "Plans start at $20.",
      extractedValue: "$20"
    });

    expect(left).not.toBe(right);
  });
});
