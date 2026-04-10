import { describe, expect, it } from "vitest";
import { buildStageGoals } from "./build-stage-goals";

describe("buildStageGoals", () => {
  it("always returns validation, mvp, and differentiation goals", () => {
    const stageGoals = buildStageGoals({
      goal: {
        name: "Target Intelligence Engine",
        category: "Product intelligence",
        jobToBeDone: "Turn goal text into an evidence-backed plan.",
        hardConstraints: ["Open source"],
        softPreferences: ["Simple"],
        currentStage: "validation"
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
          id: "usability",
          name: "Usability",
          weight: 0.4,
          direction: "higher_better",
          definition: "Ease of use.",
          evidenceNeeded: ["docs"],
          layer: "core",
          enabled: true
        },
        {
          id: "ecosystem",
          name: "Ecosystem",
          weight: 0.3,
          direction: "higher_better",
          definition: "Breadth of integrations.",
          evidenceNeeded: ["docs"],
          layer: "domain",
          enabled: true
        }
      ],
      candidates: [
        {
          id: "product-a",
          name: "Product A",
          matchedModes: ["same_goal"],
          officialUrl: "https://a.example.com",
          strengthDimensions: ["cost"],
          sources: [],
          matchedQueries: [],
          recallRank: 1
        },
        {
          id: "product-b",
          name: "Product B",
          matchedModes: ["dimension_leader"],
          officialUrl: "https://b.example.com",
          strengthDimensions: ["usability"],
          sources: [],
          matchedQueries: [],
          recallRank: 2
        }
      ],
      scoring: {
        generatedAt: "2026-04-10T00:00:00.000Z",
        candidateScorecards: [],
        gaps: [
          {
            dimensionId: "usability",
            status: "known",
            benchmarkCandidateId: "product-b",
            benchmarkCandidateName: "Product B",
            benchmarkMatchedModes: ["dimension_leader"],
            benchmarkEvidenceIds: ["e-1"],
            benchmarkScore: 86,
            baselineScore: 60,
            gapSize: 26,
            priority: 10.4,
            summary: "Product B leads usability."
          },
          {
            dimensionId: "cost",
            status: "known",
            benchmarkCandidateId: "product-a",
            benchmarkCandidateName: "Product A",
            benchmarkMatchedModes: ["same_goal"],
            benchmarkEvidenceIds: ["e-2"],
            benchmarkScore: 81,
            baselineScore: 72,
            gapSize: 9,
            priority: 2.7,
            summary: "Product A leads cost."
          }
        ]
      }
    });

    expect(stageGoals.map((goal) => goal.stage)).toEqual([
      "validation",
      "mvp",
      "differentiation"
    ]);
    expect(stageGoals).toHaveLength(3);
    expect(stageGoals[0]?.basedOnGaps).toEqual(["usability"]);
    expect(stageGoals[0]?.referenceProducts).toEqual(["Product B"]);
    expect(stageGoals[1]?.basedOnGaps).toEqual(["cost"]);
    expect(stageGoals[2]?.basedOnGaps.length).toBeGreaterThan(0);
  });

  it("falls back to enabled dimensions when no known gaps exist", () => {
    const stageGoals = buildStageGoals({
      goal: null,
      dimensions: [
        {
          id: "cost",
          name: "Cost",
          weight: 0.6,
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
          definition: "Ecosystem breadth.",
          evidenceNeeded: ["docs"],
          layer: "core",
          enabled: true
        }
      ],
      candidates: [],
      scoring: {
        generatedAt: "2026-04-10T00:00:00.000Z",
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

    expect(stageGoals).toHaveLength(3);
    expect(stageGoals[0]?.basedOnGaps).toEqual([]);
    expect(stageGoals[0]?.relatedDimensions).toEqual(["cost"]);
    expect(stageGoals[1]?.relatedDimensions).toEqual(["ecosystem"]);
  });
});
