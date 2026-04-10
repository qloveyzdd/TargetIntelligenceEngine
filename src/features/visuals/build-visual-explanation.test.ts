import { describe, expect, it } from "vitest";
import type { AnalysisRun } from "@/features/analysis-run/types";
import { buildVisualExplanation } from "./build-visual-explanation";

function createRun(): AnalysisRun {
  return {
    id: "run-visual",
    status: "evidence_ready",
    inputText: "Build a target intelligence engine.",
    inputNotes: null,
    goal: {
      name: "Target Intelligence Engine",
      category: "Product intelligence",
      jobToBeDone: "Explain why candidates matter.",
      hardConstraints: ["open source"],
      softPreferences: ["simple"],
      currentStage: "mvp"
    },
    dimensions: [
      {
        id: "cost",
        name: "Cost",
        weight: 0.5,
        direction: "lower_better",
        definition: "Cost profile.",
        evidenceNeeded: ["pricing"],
        layer: "core",
        enabled: true
      }
    ],
    searchPlan: null,
    candidates: [
      {
        id: "prod-a",
        name: "Product A",
        matchedModes: ["same_goal", "dimension_leader"],
        officialUrl: "https://a.example.com",
        strengthDimensions: ["cost"],
        sources: [],
        matchedQueries: [],
        recallRank: 1
      }
    ],
    evidence: [
      {
        id: "e-cost-1",
        candidateId: "prod-a",
        dimensionId: "cost",
        sourceType: "pricing",
        url: "https://a.example.com/pricing",
        excerpt: "Starts at $29 per seat.",
        extractedValue: "$29",
        confidence: 0.92,
        capturedAt: "2026-04-10T00:00:00.000Z"
      }
    ],
    scoring: {
      generatedAt: "2026-04-10T00:00:00.000Z",
      candidateScorecards: [
        {
          candidateId: "prod-a",
          overallScore: 84,
          coverage: 1,
          unknownCount: 0,
          dimensionScorecards: [
            {
              candidateId: "prod-a",
              dimensionId: "cost",
              status: "known",
              score: 84,
              coverage: 1,
              evidenceIds: ["e-cost-1"],
              contributions: [],
              summary: "Product A has strong cost evidence."
            }
          ]
        }
      ],
      gaps: [
        {
          dimensionId: "cost",
          status: "known",
          benchmarkCandidateId: "prod-a",
          benchmarkCandidateName: "Product A",
          benchmarkMatchedModes: ["same_goal", "dimension_leader"],
          benchmarkEvidenceIds: ["e-cost-1"],
          benchmarkScore: 84,
          baselineScore: 70,
          gapSize: 14,
          priority: 7,
          summary: "Product A leads cost by 14 points."
        }
      ]
    },
    stageGoals: [],
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-10T00:00:00.000Z"
  };
}

describe("buildVisualExplanation", () => {
  it("builds candidate explanations with overall score, coverage, and evidence", () => {
    const explanation = buildVisualExplanation({
      run: createRun(),
      target: {
        type: "candidate",
        candidateId: "prod-a"
      }
    });

    expect(explanation?.title).toBe("Product A");
    expect(explanation?.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "总分",
          value: "84.0"
        })
      ])
    );
    expect(explanation?.evidence[0]?.id).toBe("e-cost-1");
  });

  it("maps graph node targets into the same explanation schema", () => {
    const explanation = buildVisualExplanation({
      run: createRun(),
      target: {
        type: "gap",
        dimensionId: "cost"
      }
    });

    expect(explanation?.subtitle).toBe("差距说明");
    expect(explanation?.related).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "基准候选",
          value: "Product A"
        })
      ])
    );
  });

  it("keeps evidence in the explanation panel instead of pushing it into the main graph", () => {
    const explanation = buildVisualExplanation({
      run: createRun(),
      target: {
        type: "edge",
        edgeId: "dimension_to_candidate:dimension:cost:candidate:prod-a",
        relation: "dimension_to_candidate",
        dimensionId: "cost",
        candidateId: "prod-a"
      }
    });

    expect(explanation?.subtitle).toBe("关系说明");
    expect(explanation?.evidence).toHaveLength(1);
    expect(explanation?.summary).toContain("strong cost evidence");
  });
});
