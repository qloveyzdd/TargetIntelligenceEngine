import { describe, expect, it } from "vitest";
import type { Candidate } from "@/features/analysis-run/types";
import { selectRadarCandidates } from "./select-radar-candidates";

const candidates: Candidate[] = [
  {
    id: "prod-a",
    name: "Product A",
    matchedModes: ["same_goal"],
    officialUrl: "https://a.example.com",
    strengthDimensions: [],
    sources: [],
    matchedQueries: [],
    recallRank: 2
  },
  {
    id: "prod-b",
    name: "Product B",
    matchedModes: ["same_goal"],
    officialUrl: "https://b.example.com",
    strengthDimensions: [],
    sources: [],
    matchedQueries: [],
    recallRank: 1
  },
  {
    id: "prod-c",
    name: "Product C",
    matchedModes: ["dimension_leader"],
    officialUrl: "https://c.example.com",
    strengthDimensions: [],
    sources: [],
    matchedQueries: [],
    recallRank: 3
  },
  {
    id: "prod-d",
    name: "Product D",
    matchedModes: ["same_goal"],
    officialUrl: "https://d.example.com",
    strengthDimensions: [],
    sources: [],
    matchedQueries: [],
    recallRank: 4
  }
];

const scoring = {
  generatedAt: "2026-04-10T00:00:00.000Z",
  candidateScorecards: [
    {
      candidateId: "prod-a",
      overallScore: 84,
      coverage: 1,
      unknownCount: 0,
      dimensionScorecards: []
    },
    {
      candidateId: "prod-b",
      overallScore: 92,
      coverage: 1,
      unknownCount: 0,
      dimensionScorecards: []
    },
    {
      candidateId: "prod-c",
      overallScore: 81,
      coverage: 1,
      unknownCount: 0,
      dimensionScorecards: []
    },
    {
      candidateId: "prod-d",
      overallScore: null,
      coverage: 0,
      unknownCount: 3,
      dimensionScorecards: []
    }
  ],
  gaps: []
};

describe("selectRadarCandidates", () => {
  it("returns the default top-three scored candidates", () => {
    const selection = selectRadarCandidates({
      candidates,
      scoring
    });

    expect(selection.defaultCandidateIds).toEqual(["prod-b", "prod-a", "prod-c"]);
    expect(selection.selectedCandidateIds).toEqual(["prod-b", "prod-a", "prod-c"]);
  });

  it("only allows manually added candidates that already have persisted scores", () => {
    const selection = selectRadarCandidates({
      candidates,
      scoring,
      selectedCandidateIds: ["prod-d", "prod-c", "prod-b"]
    });

    expect(selection.selectedCandidateIds).toEqual(["prod-b", "prod-c"]);
    expect(selection.availableCandidateIds).not.toContain("prod-d");
  });

  it("manual removal only changes the visible set", () => {
    const selection = selectRadarCandidates({
      candidates,
      scoring,
      selectedCandidateIds: ["prod-c"]
    });

    expect(selection.selectedCandidateIds).toEqual(["prod-c"]);
    expect(selection.defaultCandidateIds).toEqual(["prod-b", "prod-a", "prod-c"]);
  });
});
