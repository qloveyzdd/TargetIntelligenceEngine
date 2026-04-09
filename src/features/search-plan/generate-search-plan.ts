import type { SearchPlanItem } from "@/features/analysis-run/types";
import { getOpenAIClient } from "@/lib/openai";
import { coerceSearchPlanDraftPayload, searchPlanDraftSchema } from "./schema";
import type { SearchPlanInput } from "./build-search-plan-input";

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSourceHints(dimensionId: string | null) {
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
    sourceHints: ["official_site", "docs", "review"]
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

export async function generateSearchPlan(input: SearchPlanInput) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockItems(input);
  }

  const response = await getOpenAIClient().responses.create({
    model: process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini",
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

  const items = coerceSearchPlanDraftPayload(JSON.parse(response.output_text));

  if (!items) {
    throw new Error("Search plan validation failed.");
  }

  return items;
}
