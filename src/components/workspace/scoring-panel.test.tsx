import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ScoringPanel } from "./scoring-panel";

describe("ScoringPanel", () => {
  it("renders summary metrics, contributions, and gap metadata from persisted scoring", () => {
    const markup = renderToStaticMarkup(
      <ScoringPanel
        run={{
          id: "run-1",
          status: "evidence_ready",
          inputText: "Build an explainable target intelligence engine.",
          inputNotes: null,
          goal: null,
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
          searchPlan: null,
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
          scoring: {
            generatedAt: "2026-04-10T00:00:00.000Z",
            candidateScorecards: [
              {
                candidateId: "openai-responses",
                overallScore: 81.4,
                coverage: 1,
                unknownCount: 0,
                dimensionScorecards: [
                  {
                    candidateId: "openai-responses",
                    dimensionId: "cost",
                    status: "known",
                    score: 81.4,
                    coverage: 1,
                    evidenceIds: ["evi-cost-1"],
                    contributions: [
                      {
                        evidenceId: "evi-cost-1",
                        sourceType: "pricing",
                        confidence: 0.82,
                        sourceWeight: 0.85,
                        contributionWeight: 0.697,
                        evidenceScore: 0.814,
                        status: "supporting",
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
                status: "known",
                benchmarkCandidateId: "openai-responses",
                benchmarkCandidateName: "OpenAI Responses",
                benchmarkMatchedModes: ["same_goal"],
                benchmarkEvidenceIds: ["evi-cost-1"],
                benchmarkScore: 81.4,
                baselineScore: 72.2,
                gapSize: 9.2,
                priority: 1.7,
                summary: "OpenAI Responses leads Cost by 9.2 points."
              }
            ]
          },
          stageGoals: [],
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z"
        }}
        onGenerate={vi.fn()}
      />
    );

    expect(markup).toContain("总分：");
    expect(markup).toContain("覆盖率 100%");
    expect(markup).toContain("evi-cost-1");
    expect(markup).toContain("差距优先级");
    expect(markup).toContain("匹配模式：");
  });

  it("renders the generate action when scoring is not ready yet", () => {
    const markup = renderToStaticMarkup(
      <ScoringPanel
        run={{
          id: "run-1",
          status: "evidence_ready",
          inputText: "Build an explainable target intelligence engine.",
          inputNotes: null,
          goal: null,
          dimensions: [],
          searchPlan: null,
          candidates: [],
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
          scoring: null,
          stageGoals: [],
          createdAt: "2026-04-10T00:00:00.000Z",
          updatedAt: "2026-04-10T00:00:00.000Z"
        }}
        onGenerate={vi.fn()}
      />
    );

    expect(markup).toContain("生成评分");
  });
});
