import type { SearchPlanItem, SourceType } from "@/features/analysis-run/types";
import {
  getOpenAIClient,
  shouldFallbackToChatCompletions,
  shouldUseChatCompletionsForStructuredJson
} from "@/lib/openai";
import { coerceSearchPlanDraftPayload, searchPlanDraftSchema } from "./schema";
import type { SearchPlanInput } from "./build-search-plan-input";

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSourceHints(dimensionId: string | null): SourceType[] {
  if (dimensionId === "cost") {
    return ["official_site", "pricing", "review"];
  }

  if (dimensionId === "compliance" || dimensionId === "private-deployment") {
    return ["official_site", "docs", "review"];
  }

  return ["official_site", "docs", "review"];
}

function buildMockItems(input: SearchPlanInput): SearchPlanItem[] {
  const sameGoalItems = Array.from({ length: Math.min(2, input.sameGoalTargetCount) }, (_, index) => ({
    id: `same-goal-${index + 1}`,
    mode: "same_goal" as const,
    dimensionId: null,
    query: `${input.goal.category} ${input.goal.name} alternatives ${index + 1}`,
    whatToFind: "Products solving the same core goal with a similar product shape.",
    whyThisSearch: "Need direct comparables before evaluating dimension leaders.",
    expectedCandidateCount: 8 - index * 2,
    sourceHints: ["official_site", "docs", "review"] as SourceType[]
  }));

  const leaderItems = input.enabledDimensions.map((dimension) => ({
    id: `leader-${normalizeId(dimension.id)}`,
    mode: "dimension_leader" as const,
    dimensionId: dimension.id,
    query: `${dimension.name} best ${input.goal.category} tools`,
    whatToFind: `Products that are noticeably strong on ${dimension.name}.`,
    whyThisSearch: `Need single-dimension leaders to benchmark ${dimension.name}.`,
    expectedCandidateCount: 6,
    sourceHints: buildSourceHints(dimension.id)
  }));

  return [...sameGoalItems, ...leaderItems];
}

function getSearchPlanModel() {
  return process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini";
}

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Search plan JSON was not found in the model response.");
  }

  return withoutFence.slice(start, end + 1);
}

function parseSearchPlanItems(raw: string) {
  const items = coerceSearchPlanDraftPayload(JSON.parse(extractJsonObject(raw)));

  if (!items) {
    throw new Error("Search plan validation failed.");
  }

  return items;
}

async function generateSearchPlanViaResponses(input: SearchPlanInput) {
  const response = await getOpenAIClient().responses.create({
    model: getSearchPlanModel(),
    instructions:
      "Generate an explainable search plan draft. Include 1-3 same_goal items and one dimension_leader item for every enabled dimension. Return strict JSON only.",
    input: JSON.stringify(input),
    text: {
      format: {
        type: "json_schema",
        name: "search_plan_draft",
        strict: true,
        schema: searchPlanDraftSchema
      }
    }
  });

  return parseSearchPlanItems(response.output_text);
}

async function generateSearchPlanViaChatCompletions(input: SearchPlanInput) {
  const response = await getOpenAIClient().chat.completions.create({
    model: getSearchPlanModel(),
    messages: [
      {
        role: "system",
        content: [
          "Generate an explainable search plan draft as strict JSON.",
          "Return exactly one object with an items array.",
          "Each item must include id, mode, dimensionId, query, whatToFind, whyThisSearch, expectedCandidateCount, sourceHints.",
          "mode must be same_goal or dimension_leader.",
          "sourceHints can only use official_site, docs, pricing, review.",
          "Include 1 to 3 same_goal items.",
          "Include one dimension_leader item for every enabled dimension.",
          "Return JSON only and do not wrap it in markdown."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify(input)
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Search plan response was empty.");
  }

  return parseSearchPlanItems(content);
}

export async function generateSearchPlan(input: SearchPlanInput) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockItems(input);
  }

  if (shouldUseChatCompletionsForStructuredJson(getSearchPlanModel())) {
    return generateSearchPlanViaChatCompletions(input);
  }

  try {
    return await generateSearchPlanViaResponses(input);
  } catch (error) {
    if (!shouldFallbackToChatCompletions(error)) {
      throw error;
    }

    return generateSearchPlanViaChatCompletions(input);
  }
}
