import { describe, expect, it } from "vitest";
import { DEEP_DIVE_LIMIT, selectTopCandidates } from "./select-top-candidates";

describe("select top candidates", () => {
  it("prioritizes same_goal candidates and assigns recall ranks", () => {
    const ranked = selectTopCandidates([
      {
        id: "b",
        name: "Dimension Leader",
        matchedModes: ["dimension_leader"],
        officialUrl: null,
        strengthDimensions: ["cost"],
        sources: [],
        matchedQueries: ["cost best tools"],
        recallRank: 0
      },
      {
        id: "a",
        name: "Direct Rival",
        matchedModes: ["same_goal"],
        officialUrl: "https://example.com",
        strengthDimensions: ["usability", "cost"],
        sources: [
          {
            sourceType: "official_site",
            url: "https://example.com"
          }
        ],
        matchedQueries: ["same goal tools"],
        recallRank: 0
      }
    ]);

    expect(ranked[0]?.id).toBe("a");
    expect(ranked[0]?.recallRank).toBe(1);
    expect(DEEP_DIVE_LIMIT).toBe(5);
  });
});
