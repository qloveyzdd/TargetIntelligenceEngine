import { describe, expect, it } from "vitest";
import type { AnalysisRun } from "@/features/analysis-run/types";
import { buildRelationshipGraph } from "./build-relationship-graph";

function createRun(): AnalysisRun {
  return {
    id: "run-graph",
    status: "evidence_ready",
    inputText: "Build a target intelligence engine.",
    inputNotes: null,
    goal: {
      name: "Target Intelligence Engine",
      category: "Product intelligence",
      jobToBeDone: "Explain candidates with evidence.",
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
      },
      {
        id: "ecosystem",
        name: "Ecosystem",
        weight: 0.5,
        direction: "higher_better",
        definition: "Ecosystem profile.",
        evidenceNeeded: ["docs"],
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
      },
      {
        id: "prod-b",
        name: "Product B",
        matchedModes: ["dimension_leader"],
        officialUrl: "https://b.example.com",
        strengthDimensions: ["ecosystem"],
        sources: [],
        matchedQueries: [],
        recallRank: 2
      }
    ],
    evidence: [],
    scoring: {
      generatedAt: "2026-04-10T00:00:00.000Z",
      candidateScorecards: [
        {
          candidateId: "prod-a",
          overallScore: 82,
          coverage: 1,
          unknownCount: 0,
          dimensionScorecards: [
            {
              candidateId: "prod-a",
              dimensionId: "cost",
              status: "known",
              score: 82,
              coverage: 1,
              evidenceIds: ["e-cost-a"],
              contributions: [],
              summary: "Cost score."
            },
            {
              candidateId: "prod-a",
              dimensionId: "ecosystem",
              status: "unknown",
              score: null,
              coverage: 0,
              evidenceIds: [],
              contributions: [],
              summary: "Unknown ecosystem score."
            }
          ]
        },
        {
          candidateId: "prod-b",
          overallScore: 91,
          coverage: 1,
          unknownCount: 0,
          dimensionScorecards: [
            {
              candidateId: "prod-b",
              dimensionId: "cost",
              status: "known",
              score: 75,
              coverage: 1,
              evidenceIds: ["e-cost-b"],
              contributions: [],
              summary: "Cost score."
            },
            {
              candidateId: "prod-b",
              dimensionId: "ecosystem",
              status: "known",
              score: 96,
              coverage: 1,
              evidenceIds: ["e-eco-b"],
              contributions: [],
              summary: "Ecosystem score."
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
          benchmarkEvidenceIds: ["e-cost-a"],
          benchmarkScore: 82,
          baselineScore: 75,
          gapSize: 7,
          priority: 3.5,
          summary: "Product A leads cost."
        },
        {
          dimensionId: "ecosystem",
          status: "unknown",
          benchmarkCandidateId: null,
          benchmarkCandidateName: null,
          benchmarkMatchedModes: [],
          benchmarkEvidenceIds: [],
          benchmarkScore: null,
          baselineScore: null,
          gapSize: null,
          priority: null,
          summary: "Unknown ecosystem gap."
        }
      ]
    },
    stageGoals: [],
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-10T00:00:00.000Z"
  };
}

describe("buildRelationshipGraph", () => {
  it("only creates Goal, Dimension, Candidate, and Gap nodes", () => {
    const graph = buildRelationshipGraph({
      run: createRun()
    });

    expect(graph?.nodes.map((node) => node.kind).sort()).toEqual([
      "candidate",
      "candidate",
      "dimension",
      "dimension",
      "gap",
      "goal"
    ]);
    expect(graph?.nodes.some((node) => node.kind === "gap" && node.id === "gap:ecosystem")).toBe(
      false
    );
  });

  it("uses persisted gaps only and never creates synthetic nodes for unknown gaps", () => {
    const graph = buildRelationshipGraph({
      run: createRun()
    });

    expect(graph?.nodes.some((node) => node.id === "gap:cost")).toBe(true);
    expect(graph?.nodes.some((node) => node.id === "gap:ecosystem")).toBe(false);
  });

  it("returns stable layout coordinates across repeated runs", () => {
    const first = buildRelationshipGraph({
      run: createRun()
    });
    const second = buildRelationshipGraph({
      run: createRun()
    });

    expect(first?.nodes.map((node) => node.position)).toEqual(
      second?.nodes.map((node) => node.position)
    );
  });
});
