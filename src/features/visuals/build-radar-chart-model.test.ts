import { describe, expect, it } from "vitest";
import type { AnalysisRun } from "@/features/analysis-run/types";
import { buildRadarChartModel } from "./build-radar-chart-model";

function createRun(): AnalysisRun {
  return {
    id: "run-1",
    status: "evidence_ready",
    inputText: "Build an evidence-first target intelligence engine.",
    inputNotes: null,
    goal: {
      name: "Target Intelligence Engine",
      category: "Product intelligence",
      jobToBeDone: "Turn evidence into competitive planning insight.",
      hardConstraints: ["open source"],
      softPreferences: ["simple"],
      currentStage: "mvp"
    },
    dimensions: [
      {
        id: "cost",
        name: "Cost",
        weight: 0.3,
        direction: "lower_better",
        definition: "Total ownership cost.",
        evidenceNeeded: ["pricing"],
        layer: "core",
        enabled: true
      },
      {
        id: "ecosystem",
        name: "Ecosystem",
        weight: 0.4,
        direction: "higher_better",
        definition: "Breadth of integrations and docs.",
        evidenceNeeded: ["docs"],
        layer: "core",
        enabled: true
      },
      {
        id: "speed",
        name: "Speed",
        weight: 0.3,
        direction: "higher_better",
        definition: "Responsiveness.",
        evidenceNeeded: ["performance"],
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
        recallRank: 3
      },
      {
        id: "prod-b",
        name: "Product B",
        matchedModes: ["same_goal", "dimension_leader"],
        officialUrl: "https://b.example.com",
        strengthDimensions: ["ecosystem"],
        sources: [],
        matchedQueries: [],
        recallRank: 1
      },
      {
        id: "prod-c",
        name: "Product C",
        matchedModes: ["dimension_leader"],
        officialUrl: "https://c.example.com",
        strengthDimensions: ["speed"],
        sources: [],
        matchedQueries: [],
        recallRank: 2
      },
      {
        id: "prod-d",
        name: "Product D",
        matchedModes: ["same_goal"],
        officialUrl: "https://d.example.com",
        strengthDimensions: ["cost"],
        sources: [],
        matchedQueries: [],
        recallRank: 4
      },
      {
        id: "prod-e",
        name: "Product E",
        matchedModes: ["same_goal"],
        officialUrl: "https://e.example.com",
        strengthDimensions: ["cost"],
        sources: [],
        matchedQueries: [],
        recallRank: 5
      }
    ],
    evidence: [],
    scoring: {
      generatedAt: "2026-04-10T00:00:00.000Z",
      candidateScorecards: [
        {
          candidateId: "prod-a",
          overallScore: 78,
          coverage: 1,
          unknownCount: 0,
          dimensionScorecards: [
            {
              candidateId: "prod-a",
              dimensionId: "cost",
              status: "known",
              score: 84,
              coverage: 1,
              evidenceIds: ["e-1"],
              contributions: [],
              summary: "Strong pricing evidence."
            },
            {
              candidateId: "prod-a",
              dimensionId: "ecosystem",
              status: "known",
              score: 70,
              coverage: 1,
              evidenceIds: ["e-2"],
              contributions: [],
              summary: "Docs coverage."
            },
            {
              candidateId: "prod-a",
              dimensionId: "speed",
              status: "known",
              score: 80,
              coverage: 1,
              evidenceIds: ["e-3"],
              contributions: [],
              summary: "Latency evidence."
            }
          ]
        },
        {
          candidateId: "prod-b",
          overallScore: 90,
          coverage: 1,
          unknownCount: 0,
          dimensionScorecards: [
            {
              candidateId: "prod-b",
              dimensionId: "cost",
              status: "known",
              score: 76,
              coverage: 1,
              evidenceIds: ["e-4"],
              contributions: [],
              summary: "Cost evidence."
            },
            {
              candidateId: "prod-b",
              dimensionId: "ecosystem",
              status: "known",
              score: 94,
              coverage: 1,
              evidenceIds: ["e-5"],
              contributions: [],
              summary: "Ecosystem evidence."
            },
            {
              candidateId: "prod-b",
              dimensionId: "speed",
              status: "known",
              score: 88,
              coverage: 1,
              evidenceIds: ["e-6"],
              contributions: [],
              summary: "Speed evidence."
            }
          ]
        },
        {
          candidateId: "prod-c",
          overallScore: 85,
          coverage: 0.67,
          unknownCount: 1,
          dimensionScorecards: [
            {
              candidateId: "prod-c",
              dimensionId: "cost",
              status: "known",
              score: 72,
              coverage: 1,
              evidenceIds: ["e-7"],
              contributions: [],
              summary: "Cost evidence."
            },
            {
              candidateId: "prod-c",
              dimensionId: "ecosystem",
              status: "unknown",
              score: null,
              coverage: 0,
              evidenceIds: ["e-8"],
              contributions: [],
              summary: "No evidence-backed ecosystem score."
            },
            {
              candidateId: "prod-c",
              dimensionId: "speed",
              status: "known",
              score: 98,
              coverage: 1,
              evidenceIds: ["e-9"],
              contributions: [],
              summary: "Speed evidence."
            }
          ]
        },
        {
          candidateId: "prod-d",
          overallScore: 81,
          coverage: 1,
          unknownCount: 0,
          dimensionScorecards: [
            {
              candidateId: "prod-d",
              dimensionId: "cost",
              status: "known",
              score: 83,
              coverage: 1,
              evidenceIds: ["e-10"],
              contributions: [],
              summary: "Cost evidence."
            },
            {
              candidateId: "prod-d",
              dimensionId: "ecosystem",
              status: "known",
              score: 79,
              coverage: 1,
              evidenceIds: ["e-11"],
              contributions: [],
              summary: "Ecosystem evidence."
            },
            {
              candidateId: "prod-d",
              dimensionId: "speed",
              status: "known",
              score: 80,
              coverage: 1,
              evidenceIds: ["e-12"],
              contributions: [],
              summary: "Speed evidence."
            }
          ]
        },
        {
          candidateId: "prod-e",
          overallScore: null,
          coverage: 0,
          unknownCount: 3,
          dimensionScorecards: [
            {
              candidateId: "prod-e",
              dimensionId: "cost",
              status: "unknown",
              score: null,
              coverage: 0,
              evidenceIds: [],
              contributions: [],
              summary: "Unknown."
            },
            {
              candidateId: "prod-e",
              dimensionId: "ecosystem",
              status: "unknown",
              score: null,
              coverage: 0,
              evidenceIds: [],
              contributions: [],
              summary: "Unknown."
            },
            {
              candidateId: "prod-e",
              dimensionId: "speed",
              status: "unknown",
              score: null,
              coverage: 0,
              evidenceIds: [],
              contributions: [],
              summary: "Unknown."
            }
          ]
        }
      ],
      gaps: []
    },
    stageGoals: [],
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-10T00:00:00.000Z"
  };
}

describe("buildRadarChartModel", () => {
  it("returns goal plus the top three scored candidates in stable order", () => {
    const model = buildRadarChartModel({
      run: createRun()
    });

    expect(model?.series.map((series) => series.label)).toEqual([
      "Target Intelligence Engine",
      "Product B",
      "Product C",
      "Product D"
    ]);
    expect(model?.selection.defaultCandidateIds).toEqual(["prod-b", "prod-c", "prod-d"]);
    expect(model?.selection.availableCandidateIds).not.toContain("prod-e");
  });

  it("preserves unknown dimensions as null instead of turning them into zero", () => {
    const model = buildRadarChartModel({
      run: createRun(),
      selectedCandidateIds: ["prod-c"]
    });
    const candidateSeries = model?.series.find((series) => series.candidateId === "prod-c");
    const ecosystem = candidateSeries?.values.find((value) => value.dimensionId === "ecosystem");

    expect(ecosystem?.status).toBe("unknown");
    expect(ecosystem?.value).toBeNull();
    expect(ecosystem?.evidenceIds).toEqual(["e-8"]);
    expect(ecosystem?.summary).toBe("No evidence-backed ecosystem score.");
  });

  it("builds from persisted scoring, dimensions, and candidates without requiring evidence", () => {
    const run = createRun();
    run.evidence = [
      {
        id: "unused-evidence",
        candidateId: "prod-b",
        dimensionId: "cost",
        sourceType: "pricing",
        url: "https://example.com/pricing",
        excerpt: "Unused in builder.",
        extractedValue: "$29",
        confidence: 0.9,
        capturedAt: "2026-04-10T00:00:00.000Z"
      }
    ];

    const model = buildRadarChartModel({
      run,
      selectedCandidateIds: ["prod-b"]
    });

    expect(model?.axes).toHaveLength(3);
    expect(model?.series[1]?.overallScore).toBe(90);
    expect(model?.series[1]?.values.map((value) => value.value)).toEqual([76, 94, 88]);
  });
});
