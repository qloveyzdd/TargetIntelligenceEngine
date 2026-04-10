import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SourceType } from "@/features/analysis-run/types";

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

import { generateCandidateDrafts } from "./generate-candidate-drafts";

function buildInput() {
  return {
    goal: {
      name: "Target Intelligence Engine",
      category: "AI Product Tool",
      jobToBeDone: "Turn product goals into explainable competitor research.",
      hardConstraints: ["Open source"],
      softPreferences: ["Explainable results"],
      currentStage: "validation" as const
    },
      item: {
        id: "same-goal-1",
        mode: "same_goal" as const,
        dimensionId: null,
        query: "target intelligence alternatives",
        whatToFind: "Direct alternatives",
        whyThisSearch: "Need direct comparables",
        expectedCandidateCount: 8,
        sourceHints: ["official_site", "docs"] as SourceType[]
      }
    };
}

describe("generate candidate drafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOCK_OPENAI = "false";
    process.env.OPENAI_BASE_URL = "";
    process.env.OPENAI_GOAL_MODEL = "gpt-5.4-mini";
    process.env.OPENAI_SEARCH_MODEL = "";
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns same_goal candidates with stable matched metadata in mock mode", async () => {
    process.env.MOCK_OPENAI = "true";

    const candidates = await generateCandidateDrafts(buildInput());

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.matchedModes).toEqual(["same_goal"]);
    expect(candidates[0]?.matchedQueries).toEqual(["target intelligence alternatives"]);
  });

  it("uses responses api by default", async () => {
    responsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        candidates: [
          {
            name: "Perplexity",
            officialUrl: "https://www.perplexity.ai",
            strengthDimensions: ["usability"],
            sources: [
              {
                sourceType: "official_site",
                url: "https://www.perplexity.ai"
              }
            ]
          }
        ]
      })
    });

    const candidates = await generateCandidateDrafts(buildInput());

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).not.toHaveBeenCalled();
    expect(candidates[0]?.name).toBe("Perplexity");
  });

  it("uses Kimi official web search tools when model is kimi", async () => {
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";

    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tools: [
            {
              type: "function",
              function: {
                name: "web_search",
                description: "Search the web",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string"
                    }
                  },
                  required: ["query"]
                }
              }
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "succeeded",
          context: {
            output: "search results"
          }
        })
      });
    vi.stubGlobal("fetch", fetchMock);
    chatCompletionsCreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call-1",
                  type: "function",
                  function: {
                    name: "web_search",
                    arguments: '{"query":"target intelligence alternatives"}'
                  }
                }
              ]
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [
                  {
                    name: "Perplexity",
                    officialUrl: "https://www.perplexity.ai",
                    strengthDimensions: ["usability"],
                    sources: [
                      {
                        sourceType: "official_site",
                        url: "https://www.perplexity.ai"
                      }
                    ]
                  }
                ]
              })
            }
          }
        ]
      });

    const candidates = await generateCandidateDrafts(buildInput());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(chatCompletionsCreate).toHaveBeenCalledTimes(2);
    expect(responsesCreate).not.toHaveBeenCalled();
    expect(candidates[0]?.name).toBe("Perplexity");
  });

  it("preserves kimi reasoning content across tool calls", async () => {
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";

    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tools: [
            {
              type: "function",
              function: {
                name: "web_search",
                description: "Search the web",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string"
                    }
                  },
                  required: ["query"]
                }
              }
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "succeeded",
          context: {
            output: "search results"
          }
        })
      });
    vi.stubGlobal("fetch", fetchMock);
    chatCompletionsCreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              reasoning_content: "先联网查一下同类产品。",
              tool_calls: [
                {
                  id: "call-1",
                  type: "function",
                  function: {
                    name: "web_search",
                    arguments: '{"query":"target intelligence alternatives"}'
                  }
                }
              ]
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                candidates: [
                  {
                    name: "Perplexity",
                    officialUrl: "https://www.perplexity.ai",
                    strengthDimensions: ["usability"],
                    sources: [
                      {
                        sourceType: "official_site",
                        url: "https://www.perplexity.ai"
                      }
                    ]
                  }
                ]
              })
            }
          }
        ]
      });

    await generateCandidateDrafts(buildInput());

    const secondCall = chatCompletionsCreate.mock.calls[1]?.[0] as {
      messages: Array<Record<string, unknown>>;
    };
    const assistantToolCallMessage = secondCall.messages[2];

    expect(assistantToolCallMessage?.reasoning_content).toBe("先联网查一下同类产品。");
    expect(assistantToolCallMessage?.tool_calls).toBeTruthy();
  });

  it("injects the dimension id for dimension leader searches", async () => {
    process.env.MOCK_OPENAI = "true";

    const candidates = await generateCandidateDrafts({
      ...buildInput(),
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
