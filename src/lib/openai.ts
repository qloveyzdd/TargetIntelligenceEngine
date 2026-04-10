import OpenAI from "openai";

declare global {
  var __targetIntelligenceOpenAI: OpenAI | undefined;
}

export type OpenAIProvider = "openai" | "moonshot" | "dashscope" | "compatible";

type ProviderDetectionInput = {
  baseURL?: string | null;
  model?: string | null;
};

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

export function normalizeBaseURL(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const normalized = trimTrailingSlashes(trimmed);

  if (normalized === "https://api.kimi.com/coding") {
    return "https://api.moonshot.cn/v1";
  }

  if (
    normalized === "https://dashscope.aliyuncs.com" ||
    normalized === "https://dashscope-intl.aliyuncs.com"
  ) {
    return `${normalized}/api/v2/apps/protocols/compatible-mode/v1`;
  }

  if (
    normalized === "https://dashscope.aliyuncs.com/compatible-mode/v1" ||
    normalized === "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  ) {
    return normalized.replace(
      /\/compatible-mode\/v1$/,
      "/api/v2/apps/protocols/compatible-mode/v1"
    );
  }

  return normalized;
}

export function detectOpenAIProvider({
  baseURL,
  model
}: ProviderDetectionInput = {}): OpenAIProvider {
  const normalizedBaseURL = normalizeBaseURL(baseURL ?? undefined)?.toLowerCase() ?? "";
  const normalizedModel = model?.trim().toLowerCase() ?? "";

  if (
    normalizedBaseURL.includes("moonshot.cn") ||
    normalizedBaseURL.includes("moonshot.ai") ||
    normalizedBaseURL.includes("kimi.com") ||
    normalizedModel.includes("kimi")
  ) {
    return "moonshot";
  }

  if (
    normalizedBaseURL.includes("dashscope") ||
    normalizedBaseURL.includes("aliyuncs.com") ||
    normalizedModel.includes("qwen")
  ) {
    return "dashscope";
  }

  if (!normalizedBaseURL || normalizedBaseURL.includes("openai.com")) {
    return "openai";
  }

  return "compatible";
}

export function getOpenAIProvider(model?: string) {
  return detectOpenAIProvider({
    baseURL: process.env.OPENAI_BASE_URL,
    model
  });
}

export function shouldUseChatCompletionsForStructuredJson(model?: string) {
  return getOpenAIProvider(model) === "moonshot";
}

export function supportsResponsesWebSearch(model?: string) {
  const provider = getOpenAIProvider(model);

  return provider === "openai" || provider === "dashscope";
}

export function shouldFallbackToChatCompletions(error: unknown) {
  const status =
    typeof error === "object" && error && "status" in error
      ? (error as { status?: unknown }).status
      : undefined;
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    status === 404 ||
    status === 405 ||
    status === 501 ||
    message.includes("404") ||
    message.includes("405") ||
    message.includes("501") ||
    message.includes("not found") ||
    message.includes("requested resource") ||
    message.includes("url.not_found") ||
    message.includes("unsupported") ||
    message.includes("not support")
  );
}

export function getOpenAIClient() {
  if (globalThis.__targetIntelligenceOpenAI) {
    return globalThis.__targetIntelligenceOpenAI;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = normalizeBaseURL(process.env.OPENAI_BASE_URL);

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required unless MOCK_OPENAI=true is enabled."
    );
  }

  globalThis.__targetIntelligenceOpenAI = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined
  });

  return globalThis.__targetIntelligenceOpenAI;
}
