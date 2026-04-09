import { beforeEach, describe, expect, it } from "vitest";
import {
  createDraftRun,
  createInMemoryAnalysisRunStore,
  getRunById,
  updateRunAggregate
} from "./repository";

function buildScoringFixture() {
  return {
    generatedAt: "2026-04-10T00:20:00.000Z",
    candidateScorecards: [
      {
        candidateId: "platform-openai-com-docs-api-reference-responses",
        overallScore: 81.4,
        coverage: 1,
        unknownCount: 0,
        dimensionScorecards: [
          {
            candidateId: "platform-openai-com-docs-api-reference-responses",
            dimensionId: "cost",
            status: "known" as const,
            score: 81.4,
            coverage: 1,
            evidenceIds: ["evi-cost-1"],
            contributions: [
              {
                evidenceId: "evi-cost-1",
                sourceType: "pricing" as const,
                confidence: 0.82,
                sourceWeight: 0.85,
                contributionWeight: 0.697,
                evidenceScore: 0.814,
                status: "supporting" as const,
                summary: "Cost evidence from pricing."
              }
            ],
            summary: "Cost scored from 1 evidence record."
          }
        ]
      }
    ],
    gaps: [
      {
        dimensionId: "cost",
        status: "known" as const,
        benchmarkCandidateId: "platform-openai-com-docs-api-reference-responses",
        benchmarkCandidateName: "OpenAI Responses",
        benchmarkMatchedModes: ["same_goal" as const],
        benchmarkEvidenceIds: ["evi-cost-1"],
        benchmarkScore: 81.4,
        baselineScore: 72.2,
        gapSize: 9.2,
        priority: 1.7,
        summary: "OpenAI Responses leads cost over the cohort baseline."
      }
    ]
  };
}

describe("analysis run repository", () => {
  beforeEach(() => {
    globalThis.__targetIntelligenceMemoryRuns = new Map();
  });

  it("creates a draft run with scoring initialized to null", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "Build an explainable target intelligence engine.",
        inputNotes: "For product planners."
      },
      store
    );

    expect(run.status).toBe("draft");
    expect(run.goal).toBeNull();
    expect(run.dimensions).toEqual([]);
    expect(run.searchPlan).toBeNull();
    expect(run.candidates).toEqual([]);
    expect(run.evidence).toEqual([]);
    expect(run.scoring).toBeNull();
    expect(run.stageGoals).toEqual([]);
  });

  it("roundtrips nested scoring data through create/update/get", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "Build an analysis workspace"
      },
      store
    );
    const scoring = buildScoringFixture();

    await updateRunAggregate(
      run.id,
      {
        goal: {
          name: "Analysis Workspace",
          category: "AI Product Tool",
          jobToBeDone: "Turn user goals into a structured GoalCard.",
          hardConstraints: ["Open source"],
          softPreferences: ["Easy to use"],
          currentStage: "validation"
        },
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
          }
        ],
        searchPlan: {
          status: "confirmed",
          items: [
            {
              id: "same-goal-1",
              mode: "same_goal",
              dimensionId: null,
              query: "analysis workspace product strategy tool",
              whatToFind: "Products solving the same planning workflow",
              whyThisSearch: "Need direct comparables for the current goal",
              expectedCandidateCount: 8,
              sourceHints: ["official_site", "docs"]
            }
          ],
          confirmedAt: "2026-04-10T00:00:00.000Z"
        },
        candidates: [
          {
            id: "platform-openai-com-docs-api-reference-responses",
            name: "OpenAI Responses",
            matchedModes: ["same_goal", "dimension_leader"],
            officialUrl: "https://platform.openai.com/docs/api-reference/responses",
            strengthDimensions: ["performance", "cost"],
            sources: [
              {
                sourceType: "official_site",
                url: "https://platform.openai.com/docs/api-reference/responses"
              },
              {
                sourceType: "docs",
                url: "https://platform.openai.com/docs/guides/structured-outputs"
              }
            ],
            matchedQueries: [
              "analysis workspace product strategy tool",
              "cost best ai planning tools"
            ],
            recallRank: 1
          }
        ],
        evidence: [
          {
            id: "evi-cost-1",
            candidateId: "platform-openai-com-docs-api-reference-responses",
            dimensionId: "cost",
            sourceType: "pricing",
            url: "https://platform.openai.com/pricing",
            excerpt: "Pricing starts with pay-as-you-go.",
            extractedValue: "pay-as-you-go",
            confidence: 0.82,
            capturedAt: "2026-04-10T00:10:00.000Z"
          }
        ],
        scoring,
        status: "evidence_ready"
      },
      store
    );

    const updated = await getRunById(run.id, store);

    expect(updated?.status).toBe("evidence_ready");
    expect(updated?.goal?.name).toBe("Analysis Workspace");
    expect(updated?.evidence[0]?.id).toBe("evi-cost-1");
    expect(updated?.scoring?.candidateScorecards[0]?.overallScore).toBe(81.4);
    expect(updated?.scoring?.gaps[0]?.benchmarkEvidenceIds).toEqual(["evi-cost-1"]);
  });

  it("clears persisted scoring when evidence changes upstream", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "Build an analysis workspace"
      },
      store
    );

    await updateRunAggregate(
      run.id,
      {
        status: "evidence_ready",
        evidence: [
          {
            id: "evi-cost-1",
            candidateId: "platform-openai-com-docs-api-reference-responses",
            dimensionId: "cost",
            sourceType: "pricing",
            url: "https://platform.openai.com/pricing",
            excerpt: "Pricing starts with pay-as-you-go.",
            extractedValue: "pay-as-you-go",
            confidence: 0.82,
            capturedAt: "2026-04-10T00:10:00.000Z"
          }
        ],
        scoring: buildScoringFixture()
      },
      store
    );

    await updateRunAggregate(
      run.id,
      {
        evidence: [
          {
            id: "evi-cost-2",
            candidateId: "platform-openai-com-docs-api-reference-responses",
            dimensionId: "cost",
            sourceType: "pricing",
            url: "https://platform.openai.com/pricing",
            excerpt: "Pricing page adds team plan details.",
            extractedValue: "$29/user",
            confidence: 0.91,
            capturedAt: "2026-04-10T00:30:00.000Z"
          }
        ]
      },
      store
    );

    const updated = await getRunById(run.id, store);

    expect(updated?.evidence[0]?.id).toBe("evi-cost-2");
    expect(updated?.scoring).toBeNull();
  });

  it("keeps persisted scoring when only the run status changes", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "Build an analysis workspace"
      },
      store
    );
    const scoring = buildScoringFixture();

    await updateRunAggregate(
      run.id,
      {
        status: "evidence_ready",
        scoring
      },
      store
    );

    await updateRunAggregate(
      run.id,
      {
        status: "evidence_ready"
      },
      store
    );

    const updated = await getRunById(run.id, store);

    expect(updated?.scoring?.generatedAt).toBe(scoring.generatedAt);
  });
});
