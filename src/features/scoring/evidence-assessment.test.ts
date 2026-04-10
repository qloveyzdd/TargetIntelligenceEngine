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

import { assessEvidence, getSourceWeight } from "./evidence-assessment";

function buildInput() {
  return {
    evidence: {
      id: "evi-cost-1",
      candidateId: "openai-responses",
      dimensionId: "cost",
      sourceType: "pricing" as const,
      url: "https://platform.openai.com/pricing",
      excerpt: "Affordable pay-as-you-go pricing for builders.",
      extractedValue: "pay-as-you-go",
      confidence: 0.82,
      capturedAt: "2026-04-10T00:00:00.000Z"
    },
    dimension: {
      id: "cost",
      name: "Cost",
      direction: "lower_better" as const,
      definition: "Total ownership cost."
    }
  };
}

describe("evidence assessment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOCK_OPENAI = "false";
    process.env.OPENAI_GOAL_MODEL = "gpt-5.4-mini";
    process.env.OPENAI_SEARCH_MODEL = "";
    process.env.OPENAI_BASE_URL = "";
  });

  it("returns source weights with official sources ranked highest", () => {
    expect(getSourceWeight("official_site")).toBeGreaterThan(getSourceWeight("review"));
    expect(getSourceWeight("docs")).toBeGreaterThan(getSourceWeight("review"));
  });

  it("builds a deterministic mock assessment for evidence", async () => {
    process.env.MOCK_OPENAI = "true";

    const assessment = await assessEvidence(buildInput());

    expect(assessment.evidenceId).toBe("evi-cost-1");
    expect(assessment.evidenceScore).not.toBeNull();
    expect(assessment.status).toBe("supporting");
  });

  it("uses chat completions directly for kimi", async () => {
    process.env.OPENAI_BASE_URL = "https://api.moonshot.cn/v1";
    process.env.OPENAI_GOAL_MODEL = "kimi-k2.5";
    chatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              status: "supporting",
              evidenceScore: 0.76,
              summary: "Pricing evidence supports the cost dimension."
            })
          }
        }
      ]
    });

    const assessment = await assessEvidence(buildInput());

    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(responsesCreate).not.toHaveBeenCalled();
    expect(assessment.evidenceScore).toBe(0.76);
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
              status: "supporting",
              evidenceScore: 0.7,
              summary: "Fallback chat evaluation succeeded."
            })
          }
        }
      ]
    });

    const assessment = await assessEvidence(buildInput());

    expect(responsesCreate).toHaveBeenCalledOnce();
    expect(chatCompletionsCreate).toHaveBeenCalledOnce();
    expect(assessment.summary).toBe("Fallback chat evaluation succeeded.");
  });
});
