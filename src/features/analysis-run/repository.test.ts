import { describe, expect, it } from "vitest";
import {
  createDraftRun,
  createInMemoryAnalysisRunStore,
  getRunById,
  updateRunAggregate
} from "./repository";

describe("analysis run repository", () => {
  it("creates a draft run with the five core aggregate fields", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "Build an explainable target intelligence engine.",
        inputNotes: "For product planners."
      },
      store
    );

    expect(run.status).toBe("draft");
    expect(run.goal).toBeNull();
    expect(run.dimensions).toEqual([]);
    expect(run.searchPlan).toBeNull();
    expect(run.candidates).toEqual([]);
    expect(run.evidence).toEqual([]);
    expect(run.stageGoals).toEqual([]);
  });

  it("updates a run aggregate and can read it back", async () => {
    const store = createInMemoryAnalysisRunStore();
    const run = await createDraftRun(
      {
        inputText: "Build an analysis workspace"
      },
      store
    );

    await updateRunAggregate(
      run.id,
      {
        goal: {
          name: "Analysis Workspace",
          category: "AI Product Tool",
          jobToBeDone: "Turn user goals into a structured GoalCard.",
          hardConstraints: ["Open source"],
          softPreferences: ["Easy to use"],
          currentStage: "validation"
        },
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
          },
          {
            id: "private-deployment",
            name: "Private Deployment",
            weight: 0.5,
            direction: "higher_better",
            definition: "How well the product supports self-hosted delivery.",
            evidenceNeeded: ["deployment_mode"],
            layer: "project",
            enabled: false
          }
        ],
        searchPlan: {
          status: "confirmed",
          items: [
            {
              id: "same-goal-1",
              mode: "same_goal",
              dimensionId: null,
              query: "analysis workspace product strategy tool",
              whatToFind: "Products solving the same planning workflow",
              whyThisSearch: "Need direct comparables for the current goal",
              expectedCandidateCount: 8,
              sourceHints: ["official_site", "docs"]
            }
          ],
          confirmedAt: "2026-04-10T00:00:00.000Z"
        },
        candidates: [
          {
            id: "platform-openai-com-docs-api-reference-responses",
            name: "OpenAI Responses",
            matchedModes: ["same_goal", "dimension_leader"],
            officialUrl: "https://platform.openai.com/docs/api-reference/responses",
            strengthDimensions: ["performance", "cost"],
            sources: [
              {
                sourceType: "official_site",
                url: "https://platform.openai.com/docs/api-reference/responses"
              },
              {
                sourceType: "docs",
                url: "https://platform.openai.com/docs/guides/structured-outputs"
              }
            ],
            matchedQueries: [
              "analysis workspace product strategy tool",
              "cost best ai planning tools"
            ],
            recallRank: 1
          }
        ],
        evidence: [
          {
            candidateId: "platform-openai-com-docs-api-reference-responses",
            dimensionId: "cost",
            sourceType: "pricing",
            url: "https://platform.openai.com/pricing",
            excerpt: "Pricing starts with pay-as-you-go.",
            extractedValue: "pay-as-you-go",
            confidence: 0.82,
            capturedAt: "2026-04-10T00:10:00.000Z"
          }
        ],
        status: "evidence_ready"
      },
      store
    );

    const updated = await getRunById(run.id, store);

    expect(updated?.status).toBe("evidence_ready");
    expect(updated?.goal?.name).toBe("Analysis Workspace");
    expect(updated?.goal?.currentStage).toBe("validation");
    expect(updated?.dimensions).toHaveLength(2);
    expect(updated?.dimensions[0]?.enabled).toBe(true);
    expect(updated?.dimensions[1]?.layer).toBe("project");
    expect(updated?.searchPlan?.items).toHaveLength(1);
    expect(updated?.searchPlan?.status).toBe("confirmed");
    expect(updated?.candidates[0]?.matchedQueries).toHaveLength(2);
    expect(updated?.candidates[0]?.sources[0]?.sourceType).toBe("official_site");
    expect(updated?.evidence[0]?.sourceType).toBe("pricing");
  });
});
