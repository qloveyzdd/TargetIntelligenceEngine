import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { generateGoalCard } from "./generate-goal-card";

describe("generateGoalCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOCK_OPENAI = "false";
    process.env.OPENAI_GOAL_MODEL = "gpt-5.4-mini";
    process.env.OPENAI_BASE_URL = "";
  });

  it("uses responses api by default", async () => {
    responsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        name: "Target Intelligence Engine",
        category: "AI Product Tool",
        jobToBeDone: "Turn a user goal into an explainable analysis run.",
        hardConstraints: ["Open source"],
        softPreferences: ["Evidence first"],
        currentStage: "validation"
      })
    });

    const goalCard = await generateGoalCard({
      inputText: "Turn a user goal into an explainable analysis run."
    });

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).not.toHaveBeenCalled();
    expect(goalCard.name).toBe("Target Intelligence Engine");
  });

  it("uses chat completions directly for kimi models", async () => {
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "Kimi GoalCard",
              category: "AI Product Tool",
              jobToBeDone: "Turn a user goal into an explainable analysis run.",
              hardConstraints: ["Open source"],
              softPreferences: ["Evidence first"],
              currentStage: "validation"
            })
          }
        }
      ]
    });

    const goalCard = await generateGoalCard({
      inputText: "Turn a user goal into an explainable analysis run."
    });

    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(responsesCreate).not.toHaveBeenCalled();
    expect(goalCard.name).toBe("Kimi GoalCard");
  });

  it("falls back to chat completions when responses endpoint returns 404", async () => {
    responsesCreate.mockRejectedValue(
      Object.assign(new Error("404 The requested resource was not found"), {
        status: 404
      })
    );
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: "Fallback GoalCard",
              category: "AI Product Tool",
              jobToBeDone: "Turn a user goal into an explainable analysis run.",
              hardConstraints: ["Open source"],
              softPreferences: ["Evidence first"],
              currentStage: "validation"
            })
          }
        }
      ]
    });

    const goalCard = await generateGoalCard({
      inputText: "Turn a user goal into an explainable analysis run."
    });

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(goalCard.name).toBe("Fallback GoalCard");
  });
});
