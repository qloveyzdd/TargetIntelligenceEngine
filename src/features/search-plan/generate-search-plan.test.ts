import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSearchPlanInput } from "./build-search-plan-input";

const responsesCreate = vi.fn();
const chatCompletionsCreate = vi.fn();

vi.mock("@/lib/openai", async () => {
  const actual = await vi.importActual<typeof import("@/lib/openai")>("@/lib/openai");

  return {
    ...actual,
    getOpenAIClient: () => ({
      responses: {
        create: responsesCreate
      },
      chat: {
        completions: {
          create: chatCompletionsCreate
        }
      }
    })
  };
});

import { generateSearchPlan } from "./generate-search-plan";

function buildInput() {
  return buildSearchPlanInput({
    goal: {
      name: "Target Intelligence Engine",
      category: "AI Product Tool",
      jobToBeDone: "Turn fuzzy product goals into a structured analysis plan.",
      hardConstraints: ["Open source"],
      softPreferences: ["Explainable results"],
      currentStage: "validation"
    },
    dimensions: [
      {
        id: "cost",
        name: "成本",
        weight: 0.4,
        direction: "lower_better",
        definition: "总体拥有成本。",
        evidenceNeeded: ["pricing"],
        layer: "core",
        enabled: true
      },
      {
        id: "private-deployment",
        name: "私有部署",
        weight: 0.3,
        direction: "higher_better",
        definition: "支持自托管。",
        evidenceNeeded: ["deployment_mode"],
        layer: "project",
        enabled: true
      },
      {
        id: "multilingual",
        name: "多语言",
        weight: 0.3,
        direction: "higher_better",
        definition: "支持多语言。",
        evidenceNeeded: ["docs"],
        layer: "project",
        enabled: false
      }
    ]
  });
}

describe("generateSearchPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOCK_OPENAI = "false";
    process.env.OPENAI_GOAL_MODEL = "gpt-5.4-mini";
    process.env.OPENAI_BASE_URL = "";
  });

  it("returns same_goal and dimension_leader items in mock mode", async () => {
    process.env.MOCK_OPENAI = "true";

    const items = await generateSearchPlan(buildInput());

    expect(items.some((item) => item.mode === "same_goal")).toBe(true);
    expect(items.some((item) => item.mode === "dimension_leader")).toBe(true);
    expect(items.some((item) => item.dimensionId === "multilingual")).toBe(false);
    expect(items.every((item) => item.expectedCandidateCount > 0)).toBe(true);
  });

  it("uses responses api by default", async () => {
    responsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        items: [
          {
            id: "same-goal-1",
            mode: "same_goal",
            dimensionId: null,
            query: "ai product tool alternatives",
            whatToFind: "Products solving the same goal.",
            whyThisSearch: "Need direct comparables.",
            expectedCandidateCount: 8,
            sourceHints: ["official_site", "docs"]
          }
        ]
      })
    });

    const items = await generateSearchPlan(buildInput());

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).not.toHaveBeenCalled();
    expect(items[0]?.id).toBe("same-goal-1");
  });

  it("uses chat completions directly for kimi models", async () => {
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              items: [
                {
                  id: "leader-cost",
                  mode: "dimension_leader",
                  dimensionId: "cost",
                  query: "best low cost tools",
                  whatToFind: "Cost leaders.",
                  whyThisSearch: "Need low-cost benchmarks.",
                  expectedCandidateCount: 6,
                  sourceHints: ["official_site", "pricing", "review"]
                }
              ]
            })
          }
        }
      ]
    });

    const items = await generateSearchPlan(buildInput());

    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(responsesCreate).not.toHaveBeenCalled();
    expect(items[0]?.id).toBe("leader-cost");
  });

  it("falls back to chat completions when responses endpoint returns 404", async () => {
    responsesCreate.mockRejectedValue(
      Object.assign(new Error('404 "url.not_found"'), {
        status: 404
      })
    );
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              items: [
                {
                  id: "same-goal-2",
                  mode: "same_goal",
                  dimensionId: null,
                  query: "product strategy tools",
                  whatToFind: "Products with a similar goal.",
                  whyThisSearch: "Need a second same-goal comparison.",
                  expectedCandidateCount: 6,
                  sourceHints: ["official_site", "docs", "review"]
                }
              ]
            })
          }
        }
      ]
    });

    const items = await generateSearchPlan(buildInput());

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(items[0]?.id).toBe("same-goal-2");
  });
});
