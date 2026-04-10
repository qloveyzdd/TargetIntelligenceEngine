import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AnalysisRun } from "@/features/analysis-run/types";
import { VisualIntelligenceSurface } from "./visual-intelligence-surface";

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
        matchedModes: ["same_goal"],
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
          benchmarkMatchedModes: ["same_goal"],
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

describe("VisualIntelligenceSurface", () => {
  it("renders radar, relationship, and shared explanation regions when scoring exists", () => {
    const markup = renderToStaticMarkup(<VisualIntelligenceSurface run={createRun()} />);

    expect(markup).toContain("雷达对比");
    expect(markup).toContain("关系图谱");
    expect(markup).toContain("目标概览");
  });

  it("does not render anything when scoring is missing", () => {
    const run = createRun();
    run.scoring = null;

    const markup = renderToStaticMarkup(<VisualIntelligenceSurface run={run} />);

    expect(markup).toBe("");
  });
});
