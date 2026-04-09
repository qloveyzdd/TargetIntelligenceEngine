import { describe, expect, it } from "vitest";
import { buildEvidenceSourceTasks } from "./build-evidence-source-tasks";

describe("build evidence source tasks", () => {
  it("limits source tasks to the top-5 candidates and dedupes urls", () => {
    const tasks = buildEvidenceSourceTasks({
      candidates: Array.from({ length: 6 }, (_, index) => ({
        id: `candidate-${index + 1}`,
        name: `Candidate ${index + 1}`,
        matchedModes: ["same_goal"],
        officialUrl: `https://example${index + 1}.com`,
        strengthDimensions: ["cost"],
        sources: [
          {
            sourceType: "official_site" as const,
            url: `https://example${index + 1}.com`
          },
          {
            sourceType: "official_site" as const,
            url: `https://example${index + 1}.com`
          }
        ],
        matchedQueries: ["same goal tools"],
        recallRank: index + 1
      })),
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
      ]
    });

    expect(tasks.every((task) => task.candidateId !== "candidate-6")).toBe(true);
    expect(tasks[0]?.sourceType).toBe("official_site");
    expect(tasks).toHaveLength(5);
  });
});
