import { beforeEach, describe, expect, it } from "vitest";
import { extractEvidence } from "./extract-evidence";

describe("extract evidence", () => {
  beforeEach(() => {
    process.env.MOCK_OPENAI = "true";
  });

  it("returns stable mock evidence", async () => {
    const evidence = await extractEvidence({
      candidate: {
        id: "productboard-com",
        name: "Productboard",
        matchedModes: ["same_goal"],
        officialUrl: "https://www.productboard.com",
        strengthDimensions: ["usability"],
        sources: [
          {
            sourceType: "official_site",
            url: "https://www.productboard.com"
          }
        ],
        matchedQueries: ["same goal tools"],
        recallRank: 1
      },
      dimension: {
        id: "usability",
        name: "Usability",
        weight: 0.5,
        direction: "higher_better",
        definition: "Onboarding clarity and workflow fit.",
        evidenceNeeded: ["docs"],
        layer: "core",
        enabled: true
      },
      task: {
        candidateId: "productboard-com",
        candidateName: "Productboard",
        dimensionId: "usability",
        sourceType: "official_site",
        url: "https://www.productboard.com"
      },
      pageText: "Productboard helps teams align around customer needs."
    });

    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.id.startsWith("evi-")).toBe(true);
    expect(evidence[0]?.candidateId).toBe("productboard-com");
    expect(evidence[0]?.sourceType).toBe("official_site");
  });
});
