import { beforeEach, describe, expect, it } from "vitest";
import { generateCandidateDrafts } from "./generate-candidate-drafts";

describe("generate candidate drafts", () => {
  beforeEach(() => {
    process.env.MOCK_OPENAI = "true";
  });

  it("returns same_goal candidates with stable matched metadata", async () => {
    const candidates = await generateCandidateDrafts({
      goal: {
        name: "Target Intelligence Engine",
        category: "AI Product Tool",
        jobToBeDone: "Turn product goals into explainable competitor research.",
        hardConstraints: ["Open source"],
        softPreferences: ["Explainable results"],
        currentStage: "validation"
      },
      item: {
        id: "same-goal-1",
        mode: "same_goal",
        dimensionId: null,
        query: "target intelligence alternatives",
        whatToFind: "Direct alternatives",
        whyThisSearch: "Need direct comparables",
        expectedCandidateCount: 8,
        sourceHints: ["official_site", "docs"]
      }
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.matchedModes).toEqual(["same_goal"]);
    expect(candidates[0]?.matchedQueries).toEqual(["target intelligence alternatives"]);
  });

  it("injects the dimension id for dimension leader searches", async () => {
    const candidates = await generateCandidateDrafts({
      goal: {
        name: "Target Intelligence Engine",
        category: "AI Product Tool",
        jobToBeDone: "Turn product goals into explainable competitor research.",
        hardConstraints: ["Open source"],
        softPreferences: ["Explainable results"],
        currentStage: "validation"
      },
      item: {
        id: "leader-cost",
        mode: "dimension_leader",
        dimensionId: "cost",
        query: "best low cost tools",
        whatToFind: "Cost leaders",
        whyThisSearch: "Need low-cost benchmarks",
        expectedCandidateCount: 6,
        sourceHints: ["official_site", "pricing"]
      }
    });

    expect(candidates.some((candidate) => candidate.strengthDimensions.includes("cost"))).toBe(
      true
    );
  });
});
