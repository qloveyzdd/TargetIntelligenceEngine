import { describe, expect, it } from "vitest";
import { normalizeCandidates } from "./normalize-candidates";

describe("normalize candidates", () => {
  it("dedupes by official domain and merges matched modes", () => {
    const normalized = normalizeCandidates([
      {
        id: "one",
        name: "OpenAI Responses",
        matchedModes: ["same_goal"],
        officialUrl: "https://platform.openai.com/docs/api-reference/responses",
        strengthDimensions: ["performance"],
        sources: [
          {
            sourceType: "official_site",
            url: "https://platform.openai.com/docs/api-reference/responses"
          }
        ],
        matchedQueries: ["target intelligence alternatives"],
        recallRank: 0
      },
      {
        id: "two",
        name: "OpenAI",
        matchedModes: ["dimension_leader"],
        officialUrl: "https://platform.openai.com/docs/api-reference/responses",
        strengthDimensions: ["cost"],
        sources: [
          {
            sourceType: "docs",
            url: "https://platform.openai.com/docs/guides/structured-outputs"
          }
        ],
        matchedQueries: ["best low cost tools"],
        recallRank: 0
      }
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.matchedModes).toEqual(["same_goal", "dimension_leader"]);
    expect(normalized[0]?.strengthDimensions).toContain("cost");
    expect(normalized[0]?.sources).toHaveLength(2);
  });
});
