import { beforeEach, describe, expect, it } from "vitest";
import { buildScoringSnapshot } from "./build-scoring-snapshot";

describe("buildScoringSnapshot", () => {
  beforeEach(() => {
    process.env.MOCK_OPENAI = "true";
  });

  it("builds candidate scorecards with overall score, coverage, and evidence ids", async () => {
    const scoring = await buildScoringSnapshot({
      candidates: [
        {
          id: "openai-responses",
          name: "OpenAI Responses",
          matchedModes: ["same_goal"],
          officialUrl: "https://platform.openai.com/docs/api-reference/responses",
          strengthDimensions: ["cost", "performance"],
          sources: [
            {
              sourceType: "official_site",
              url: "https://platform.openai.com/docs/api-reference/responses"
            }
          ],
          matchedQueries: ["target intelligence engine"],
          recallRank: 1
        }
      ],
      dimensions: [
        {
          id: "cost",
          name: "Cost",
          weight: 0.5,
          direction: "lower_better",
          definition: "Total ownership cost.",
          evidenceNeeded: ["pricing"],
          layer: "core",
          enabled: true
        },
        {
          id: "ecosystem",
          name: "Ecosystem",
          weight: 0.5,
          direction: "higher_better",
          definition: "How broad the ecosystem is.",
          evidenceNeeded: ["docs"],
          layer: "core",
          enabled: true
        }
      ],
      evidence: [
        {
          id: "evi-cost-1",
          candidateId: "openai-responses",
          dimensionId: "cost",
          sourceType: "pricing",
          url: "https://platform.openai.com/pricing",
          excerpt: "Affordable pay-as-you-go pricing for builders.",
          extractedValue: "pay-as-you-go",
          confidence: 0.82,
          capturedAt: "2026-04-10T00:00:00.000Z"
        }
      ]
    });

    expect(scoring.candidateScorecards).toHaveLength(1);
    expect(scoring.candidateScorecards[0]?.overallScore).not.toBeNull();
    expect(scoring.candidateScorecards[0]?.coverage).toBe(0.5);
    expect(scoring.candidateScorecards[0]?.unknownCount).toBe(1);
    expect(
      scoring.candidateScorecards[0]?.dimensionScorecards[0]?.evidenceIds
    ).toEqual(["evi-cost-1"]);
    expect(scoring.gaps).toEqual([]);
  });

  it("keeps dimensions with no usable evidence as unknown instead of low score", async () => {
    const scoring = await buildScoringSnapshot({
      candidates: [
        {
          id: "review-only-tool",
          name: "Review Only Tool",
          matchedModes: ["dimension_leader"],
          officialUrl: "https://example.com",
          strengthDimensions: ["cost"],
          sources: [
            {
              sourceType: "review",
              url: "https://example.com"
            }
          ],
          matchedQueries: ["cheap tools"],
          recallRank: 1
        }
      ],
      dimensions: [
        {
          id: "cost",
          name: "Cost",
          weight: 1,
          direction: "lower_better",
          definition: "Total ownership cost.",
          evidenceNeeded: ["pricing"],
          layer: "core",
          enabled: true
        }
      ],
      evidence: [
        {
          id: "evi-thin-1",
          candidateId: "review-only-tool",
          dimensionId: "cost",
          sourceType: "review",
          url: "https://example.com/review",
          excerpt: "ok",
          extractedValue: "ok",
          confidence: 0.2,
          capturedAt: "2026-04-10T00:00:00.000Z"
        }
      ]
    });

    expect(scoring.candidateScorecards[0]?.overallScore).toBeNull();
    expect(scoring.candidateScorecards[0]?.coverage).toBe(0);
    expect(scoring.candidateScorecards[0]?.dimensionScorecards[0]?.status).toBe("unknown");
    expect(scoring.candidateScorecards[0]?.dimensionScorecards[0]?.score).toBeNull();
  });
});
