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

import { extractEvidence } from "./extract-evidence";

function buildInput() {
  return {
    candidate: {
      id: "productboard-com",
      name: "Productboard",
      matchedModes: ["same_goal" as const],
      officialUrl: "https://www.productboard.com",
      strengthDimensions: ["usability"],
      sources: [
        {
          sourceType: "official_site" as const,
          url: "https://www.productboard.com"
        }
      ],
      matchedQueries: ["same goal tools"],
      recallRank: 1
    },
    dimension: {
      id: "usability",
      name: "Usability",
      weight: 0.5,
      direction: "higher_better" as const,
      definition: "Onboarding clarity and workflow fit.",
      evidenceNeeded: ["docs"],
      layer: "core" as const,
      enabled: true
    },
    task: {
      candidateId: "productboard-com",
      candidateName: "Productboard",
      dimensionId: "usability",
      sourceType: "official_site" as const,
      url: "https://www.productboard.com"
    },
    pageText: "Productboard helps teams align around customer needs."
  };
}

describe("extract evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOCK_OPENAI = "false";
    process.env.OPENAI_GOAL_MODEL = "gpt-5.4-mini";
    process.env.OPENAI_SEARCH_MODEL = "";
    process.env.OPENAI_BASE_URL = "";
  });

  it("returns stable mock evidence", async () => {
    process.env.MOCK_OPENAI = "true";

    const evidence = await extractEvidence(buildInput());

    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.id.startsWith("evi-")).toBe(true);
    expect(evidence[0]?.candidateId).toBe("productboard-com");
    expect(evidence[0]?.sourceType).toBe("official_site");
  });

  it("uses chat completions directly for kimi", async () => {
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              evidence: [
                {
                  candidateId: "productboard-com",
                  dimensionId: "usability",
                  sourceType: "official_site",
                  url: "https://www.productboard.com",
                  excerpt: "Productboard helps teams align around customer needs.",
                  extractedValue: "align around customer needs",
                  confidence: 0.92,
                  capturedAt: "2026-04-10T00:00:00.000Z"
                }
              ]
            })
          }
        }
      ]
    });

    const evidence = await extractEvidence(buildInput());

    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(responsesCreate).not.toHaveBeenCalled();
    expect(evidence[0]?.confidence).toBe(0.92);
  });

  it("falls back to chat completions when responses endpoint is unsupported", async () => {
    responsesCreate.mockRejectedValue(
      Object.assign(new Error("404 url.not_found"), {
        status: 404
      })
    );
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              evidence: [
                {
                  candidateId: "productboard-com",
                  dimensionId: "usability",
                  sourceType: "official_site",
                  url: "https://www.productboard.com",
                  excerpt: "Productboard helps teams align around customer needs.",
                  extractedValue: "align around customer needs",
                  confidence: 0.88,
                  capturedAt: "2026-04-10T00:00:00.000Z"
                }
              ]
            })
          }
        }
      ]
    });

    const evidence = await extractEvidence(buildInput());

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(evidence[0]?.confidence).toBe(0.88);
  });

  it("accepts lenient kimi evidence payloads and fills required fields", async () => {
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              evidence: [
                {
                  excerpt: "Productboard helps teams align around customer needs.",
                  value: "align around customer needs",
                  confidence: "0.76"
                }
              ]
            })
          }
        }
      ]
    });

    const evidence = await extractEvidence(buildInput());

    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.candidateId).toBe("productboard-com");
    expect(evidence[0]?.dimensionId).toBe("usability");
    expect(evidence[0]?.sourceType).toBe("official_site");
    expect(evidence[0]?.url).toBe("https://www.productboard.com");
    expect(evidence[0]?.confidence).toBe(0.76);
  });

  it("repairs invalid kimi json before giving up", async () => {
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    chatCompletionsCreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                '{"evidence":[{"excerpt":"bad "quote" payload","value":"fixed value","confidence":0.7}]}'
            }
          }
        ]
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                evidence: [
                  {
                    excerpt: 'bad "quote" payload',
                    extractedValue: "fixed value",
                    confidence: 0.7
                  }
                ]
              })
            }
          }
        ]
      });

    const evidence = await extractEvidence(buildInput());

    expect(chatCompletionsCreate).toHaveBeenCalledTimes(2);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.excerpt).toBe('bad "quote" payload');
    expect(evidence[0]?.confidence).toBe(0.7);
  });
});
