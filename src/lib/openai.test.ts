import { describe, expect, it } from "vitest";
import {
  detectOpenAIProvider,
  normalizeBaseURL,
  shouldUseChatCompletionsForStructuredJson,
  supportsResponsesWebSearch
} from "./openai";

describe("openai provider compatibility", () => {
  it("normalizes kimi coding endpoint to moonshot base url", () => {
    expect(normalizeBaseURL("https://api.kimi.com/coding/")).toBe(
      "https://api.moonshot.cn/v1"
    );
  });

  it("normalizes dashscope compatible chat endpoint to responses endpoint", () => {
    expect(normalizeBaseURL("https://dashscope.aliyuncs.com/compatible-mode/v1")).toBe(
      "https://dashscope.aliyuncs.com/api/v2/apps/protocols/compatible-mode/v1"
    );
  });

  it("detects moonshot and prefers chat completions for structured json", () => {
    expect(
      detectOpenAIProvider({
        baseURL: "https://api.moonshot.cn/v1",
        model: "kimi-k2.5"
      })
    ).toBe("moonshot");
    expect(shouldUseChatCompletionsForStructuredJson("kimi-k2.5")).toBe(true);
  });

  it("detects dashscope and keeps responses web search enabled", () => {
    expect(
      detectOpenAIProvider({
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model: "qwen-plus"
      })
    ).toBe("dashscope");
    expect(supportsResponsesWebSearch("qwen-plus")).toBe(true);
  });
});
