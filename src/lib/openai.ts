import OpenAI from "openai";

declare global {
  var __targetIntelligenceOpenAI: OpenAI | undefined;
}

export function getOpenAIClient() {
  if (globalThis.__targetIntelligenceOpenAI) {
    return globalThis.__targetIntelligenceOpenAI;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required unless MOCK_OPENAI=true is enabled."
    );
  }

  globalThis.__targetIntelligenceOpenAI = new OpenAI({ apiKey });

  return globalThis.__targetIntelligenceOpenAI;
}
