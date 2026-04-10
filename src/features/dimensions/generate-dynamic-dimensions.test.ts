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

import { generateDynamicDimensions } from "./generate-dynamic-dimensions";

describe("generateDynamicDimensions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOCK_OPENAI = "false";
    process.env.OPENAI_GOAL_MODEL = "gpt-5.4-mini";
    process.env.OPENAI_BASE_URL = "";
  });

  it("returns only domain and project dimensions in mock mode", async () => {
    process.env.MOCK_OPENAI = "true";

    const dimensions = await generateDynamicDimensions({
      goal: {
        name: "Target Intelligence Engine",
        category: "AI Product Tool",
        jobToBeDone: "Turn fuzzy product goals into an evidence-backed analysis workspace.",
        hardConstraints: ["Open source", "Private deployment later"],
        softPreferences: ["Explainable results", "Small team friendly"],
        currentStage: "validation"
      },
      coreDimensions: []
    });

    expect(dimensions.length).toBeGreaterThanOrEqual(3);
    expect(dimensions.every((dimension) => dimension.layer !== "core")).toBe(true);
    expect(dimensions.every((dimension) => dimension.enabled)).toBe(true);
    expect(dimensions[0]?.name).toBe("模型质量");
    expect(dimensions[0]?.definition).toContain("底层模型");
  });

  it("uses responses api by default", async () => {
    responsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        dimensions: [
          {
            id: "model-quality",
            name: "Model Quality",
            weight: 0.12,
            direction: "higher_better",
            definition: "How strong the model quality is.",
            evidenceNeeded: ["quality_signal", "model_info"],
            layer: "domain",
            enabled: true
          }
        ]
      })
    });

    const dimensions = await generateDynamicDimensions({
      goal: {
        name: "Target Intelligence Engine",
        category: "AI Product Tool",
        jobToBeDone: "Turn fuzzy product goals into an evidence-backed analysis workspace.",
        hardConstraints: ["Open source"],
        softPreferences: ["Explainable results"],
        currentStage: "validation"
      },
      coreDimensions: []
    });

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).not.toHaveBeenCalled();
    expect(dimensions[0]?.id).toBe("model-quality");
  });

  it("uses chat completions directly for kimi models", async () => {
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              dimensions: [
                {
                  id: "evidence-traceability",
                  name: "Evidence Traceability",
                  weight: 0.1,
                  direction: "higher_better",
                  definition: "How well the product keeps outputs tied to evidence.",
                  evidenceNeeded: ["citations", "evidence_chain"],
                  layer: "project",
                  enabled: true
                }
              ]
            })
          }
        }
      ]
    });

    const dimensions = await generateDynamicDimensions({
      goal: {
        name: "Target Intelligence Engine",
        category: "AI Product Tool",
        jobToBeDone: "Turn fuzzy product goals into an evidence-backed analysis workspace.",
        hardConstraints: ["Open source"],
        softPreferences: ["Explainable results"],
        currentStage: "validation"
      },
      coreDimensions: []
    });

    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(responsesCreate).not.toHaveBeenCalled();
    expect(dimensions[0]?.id).toBe("evidence-traceability");
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
              dimensions: [
                {
                  id: "small-team-fit",
                  name: "Small Team Fit",
                  weight: 0.09,
                  direction: "higher_better",
                  definition: "How manageable the product is for a lean team.",
                  evidenceNeeded: ["pricing", "setup_time"],
                  layer: "project",
                  enabled: true
                }
              ]
            })
          }
        }
      ]
    });

    const dimensions = await generateDynamicDimensions({
      goal: {
        name: "Target Intelligence Engine",
        category: "AI Product Tool",
        jobToBeDone: "Turn fuzzy product goals into an evidence-backed analysis workspace.",
        hardConstraints: ["Open source"],
        softPreferences: ["Explainable results"],
        currentStage: "validation"
      },
      coreDimensions: []
    });

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(dimensions[0]?.id).toBe("small-team-fit");
  });
});
