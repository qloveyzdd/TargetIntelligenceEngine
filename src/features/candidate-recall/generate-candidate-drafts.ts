import type { Candidate, GoalCard, SearchPlanItem } from "@/features/analysis-run/types";
import { getOpenAIClient } from "@/lib/openai";
import {
  candidateDraftPayloadSchema,
  coerceCandidateDraftPayload,
  type CandidateDraft
} from "./candidate-schema";

type GenerateCandidateDraftsInput = {
  goal: GoalCard;
  item: SearchPlanItem;
};

const mockCatalog: Record<string, CandidateDraft> = {
  "openai-responses": {
    name: "OpenAI Responses",
    officialUrl: "https://platform.openai.com/docs/api-reference/responses",
    strengthDimensions: ["performance", "context-handling", "evidence-traceability"],
    sources: [
      {
        sourceType: "official_site",
        url: "https://platform.openai.com/docs/api-reference/responses"
      },
      {
        sourceType: "docs",
        url: "https://platform.openai.com/docs/guides/structured-outputs"
      }
    ]
  },
  perplexity: {
    name: "Perplexity",
    officialUrl: "https://www.perplexity.ai",
    strengthDimensions: ["usability", "performance"],
    sources: [
      {
        sourceType: "official_site",
        url: "https://www.perplexity.ai"
      },
      {
        sourceType: "review",
        url: "https://www.g2.com/products/perplexity-ai/reviews"
      }
    ]
  },
  productboard: {
    name: "Productboard",
    officialUrl: "https://www.productboard.com",
    strengthDimensions: ["ecosystem", "usability"],
    sources: [
      {
        sourceType: "official_site",
        url: "https://www.productboard.com"
      },
      {
        sourceType: "pricing",
        url: "https://www.productboard.com/pricing/"
      }
    ]
  },
  posthog: {
    name: "PostHog",
    officialUrl: "https://posthog.com",
    strengthDimensions: ["cost", "private-deployment", "compliance"],
    sources: [
      {
        sourceType: "official_site",
        url: "https://posthog.com"
      },
      {
        sourceType: "pricing",
        url: "https://posthog.com/pricing"
      },
      {
        sourceType: "docs",
        url: "https://posthog.com/docs"
      }
    ]
  },
  n8n: {
    name: "n8n",
    officialUrl: "https://n8n.io",
    strengthDimensions: ["cost", "ecosystem", "automation-support"],
    sources: [
      {
        sourceType: "official_site",
        url: "https://n8n.io"
      },
      {
        sourceType: "docs",
        url: "https://docs.n8n.io"
      },
      {
        sourceType: "pricing",
        url: "https://n8n.io/pricing/"
      }
    ]
  },
  "open-webui": {
    name: "Open WebUI",
    officialUrl: "https://openwebui.com",
    strengthDimensions: ["private-deployment", "compliance", "small-team-fit"],
    sources: [
      {
        sourceType: "official_site",
        url: "https://openwebui.com"
      },
      {
        sourceType: "docs",
        url: "https://docs.openwebui.com"
      }
    ]
  }
};

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCandidate(draft: CandidateDraft, item: SearchPlanItem): Candidate {
  const officialSource = draft.sources.find((source) => source.sourceType === "official_site");
  const officialUrl = draft.officialUrl ?? officialSource?.url ?? null;

  return {
    id: normalizeId(officialUrl ?? draft.name),
    name: draft.name,
    officialUrl,
    matchedModes: [item.mode],
    strengthDimensions: Array.from(
      new Set(item.dimensionId ? [...draft.strengthDimensions, item.dimensionId] : draft.strengthDimensions)
    ),
    sources: draft.sources,
    matchedQueries: [item.query],
    recallRank: 0
  };
}

function buildMockDrafts(item: SearchPlanItem) {
  const keys =
    item.mode === "same_goal"
      ? ["openai-responses", "perplexity", "productboard"]
      : item.dimensionId === "cost"
        ? ["n8n", "posthog", "openai-responses"]
        : item.dimensionId === "compliance" || item.dimensionId === "private-deployment"
          ? ["open-webui", "posthog", "openai-responses"]
          : ["openai-responses", "perplexity", "n8n"];

  return keys.map((key) => mockCatalog[key]).filter(Boolean);
}

export async function generateCandidateDrafts(input: GenerateCandidateDraftsInput) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockDrafts(input.item).map((draft) => toCandidate(draft, input.item));
  }

  const response = await getOpenAIClient().responses.create({
    model: process.env.OPENAI_SEARCH_MODEL ?? process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini",
    instructions:
      "Use the web search tool to find public products matching the search task. Return strict JSON only. Each candidate must include its official site when available, source URLs, and the dimensions it appears strong in.",
    input: JSON.stringify(input),
    parallel_tool_calls: false,
    tools: [
      {
        type: "web_search",
        search_context_size: "medium"
      }
    ],
    include: ["web_search_call.action.sources"],
    text: {
      format: {
        type: "json_schema",
        name: "candidate_recall_draft",
        strict: true,
        schema: candidateDraftPayloadSchema
      }
    }
  });

  const drafts = coerceCandidateDraftPayload(JSON.parse(response.output_text));

  if (!drafts) {
    throw new Error("Candidate recall draft validation failed.");
  }

  return drafts.map((draft) => toCandidate(draft, input.item));
}
