import { describe, expect, it } from "vitest";
import { buildGapPriorities } from "./build-gap-priorities";

describe("buildGapPriorities", () => {
  it("creates benchmark-backed gaps from known dimension scores", () => {
    const gaps = buildGapPriorities({
      dimensions: [
        {
          id: "cost",
          name: "Cost",
          weight: 0.4,
          direction: "lower_better",
          definition: "Total ownership cost.",
          evidenceNeeded: ["pricing"],
          layer: "core",
          enabled: true
        },
        {
          id: "ecosystem",
          name: "Ecosystem",
          weight: 0.6,
          direction: "higher_better",
          definition: "Ecosystem coverage.",
          evidenceNeeded: ["docs"],
          layer: "core",
          enabled: true
        }
      ],
      candidates: [
        {
          id: "openai-responses",
          name: "OpenAI Responses",
          matchedModes: ["same_goal"],
          officialUrl: "https://platform.openai.com/docs/api-reference/responses",
          strengthDimensions: ["cost"],
          sources: [],
          matchedQueries: [],
          recallRank: 1
        },
        {
          id: "productboard",
          name: "Productboard",
          matchedModes: ["same_goal", "dimension_leader"],
          officialUrl: "https://www.productboard.com",
          strengthDimensions: ["ecosystem"],
          sources: [],
          matchedQueries: [],
          recallRank: 2
        }
      ],
      scoring: {
        generatedAt: "2026-04-10T00:00:00.000Z",
        candidateScorecards: [
          {
            candidateId: "openai-responses",
            overallScore: 80,
            coverage: 1,
            unknownCount: 0,
            dimensionScorecards: [
              {
                candidateId: "openai-responses",
                dimensionId: "cost",
                status: "known",
                score: 82,
                coverage: 1,
                evidenceIds: ["evi-cost-1"],
                contributions: [],
                summary: "Cost"
              },
              {
                candidateId: "openai-responses",
                dimensionId: "ecosystem",
                status: "known",
                score: 68,
                coverage: 1,
                evidenceIds: ["evi-eco-1"],
                contributions: [],
                summary: "Ecosystem"
              }
            ]
          },
          {
            candidateId: "productboard",
            overallScore: 76,
            coverage: 1,
            unknownCount: 0,
            dimensionScorecards: [
              {
                candidateId: "productboard",
                dimensionId: "cost",
                status: "known",
                score: 70,
                coverage: 1,
                evidenceIds: ["evi-cost-2"],
                contributions: [],
                summary: "Cost"
              },
              {
                candidateId: "productboard",
                dimensionId: "ecosystem",
                status: "known",
                score: 88,
                coverage: 1,
                evidenceIds: ["evi-eco-2"],
                contributions: [],
                summary: "Ecosystem"
              }
            ]
          }
        ],
        gaps: []
      }
    });

    expect(gaps).toHaveLength(2);
    expect(gaps[0]?.status).toBe("known");
    expect(gaps[0]?.benchmarkCandidateId).toBeTruthy();
    expect(gaps[0]?.benchmarkEvidenceIds.length).toBeGreaterThan(0);
  });

  it("returns unknown when no evidence-backed benchmark exists", () => {
    const gaps = buildGapPriorities({
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
      candidates: [],
      scoring: {
        generatedAt: "2026-04-10T00:00:00.000Z",
        candidateScorecards: [],
        gaps: []
      }
    });

    expect(gaps[0]?.status).toBe("unknown");
    expect(gaps[0]?.priority).toBeNull();
  });
});
