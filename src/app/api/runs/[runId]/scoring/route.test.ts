import { beforeEach, describe, expect, it } from "vitest";
import { createDraftRun, getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { POST } from "./route";

describe("scoring route", () => {
  beforeEach(() => {
    process.env.ANALYSIS_RUN_STORE = "memory";
    process.env.MOCK_OPENAI = "true";
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("generates persisted scoring and gaps from evidence", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable target intelligence engine."
    });

    await updateRunAggregate(run.id, {
      status: "evidence_ready",
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
          definition: "Ecosystem breadth.",
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
          sources: [
            {
              sourceType: "official_site",
              url: "https://platform.openai.com/docs/api-reference/responses"
            }
          ],
          matchedQueries: ["same goal tools"],
          recallRank: 1
        },
        {
          id: "productboard",
          name: "Productboard",
          matchedModes: ["dimension_leader"],
          officialUrl: "https://www.productboard.com",
          strengthDimensions: ["ecosystem"],
          sources: [
            {
              sourceType: "official_site",
              url: "https://www.productboard.com"
            }
          ],
          matchedQueries: ["ecosystem leader"],
          recallRank: 2
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
        },
        {
          id: "evi-eco-1",
          candidateId: "productboard",
          dimensionId: "ecosystem",
          sourceType: "docs",
          url: "https://www.productboard.com/docs",
          excerpt: "Strong integration ecosystem and clear onboarding docs.",
          extractedValue: "integration ecosystem",
          confidence: 0.88,
          capturedAt: "2026-04-10T00:00:00.000Z"
        }
      ]
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/scoring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({ runId: run.id })
      }
    );
    const payload = (await response.json()) as {
      run?: {
        scoring: {
          candidateScorecards: Array<{ overallScore: number | null }>;
          gaps: Array<{ benchmarkEvidenceIds: string[] }>;
        } | null;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.scoring?.candidateScorecards.length).toBe(2);
    expect(payload.run?.scoring?.candidateScorecards[0]?.overallScore).not.toBeNull();
    expect(payload.run?.scoring?.gaps[0]?.benchmarkEvidenceIds.length).toBeGreaterThan(0);

    const persistedRun = await getRunById(run.id);
    expect(persistedRun?.scoring?.candidateScorecards.length).toBe(2);
  });

  it("returns cached scoring when already persisted", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable target intelligence engine."
    });

    await updateRunAggregate(run.id, {
      status: "evidence_ready",
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
      scoring: {
        generatedAt: "2026-04-10T00:10:00.000Z",
        candidateScorecards: [],
        gaps: [
          {
            dimensionId: "cost",
            status: "unknown",
            benchmarkCandidateId: null,
            benchmarkCandidateName: null,
            benchmarkMatchedModes: [],
            benchmarkEvidenceIds: [],
            benchmarkScore: null,
            baselineScore: null,
            gapSize: null,
            priority: null,
            summary: "Unknown."
          }
        ]
      }
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/scoring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({ runId: run.id })
      }
    );
    const payload = (await response.json()) as {
      run?: {
        scoring: {
          generatedAt: string;
        } | null;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.run?.scoring?.generatedAt).toBe("2026-04-10T00:10:00.000Z");
  });

  it("rejects scoring generation when evidence is missing", async () => {
    const run = await createDraftRun({
      inputText: "Build an explainable target intelligence engine."
    });

    const response = await POST(
      new Request("http://localhost/api/runs/test/scoring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }),
      {
        params: Promise.resolve({ runId: run.id })
      }
    );

    expect(response.status).toBe(400);
  });
});
