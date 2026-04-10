import type OpenAI from "openai";
import type { Candidate, GoalCard, SearchPlanItem } from "@/features/analysis-run/types";
import {
  getOpenAIClient,
  getOpenAIProvider,
  normalizeBaseURL,
  shouldFallbackToChatCompletions,
  supportsResponsesWebSearch
} from "@/lib/openai";
import {
  candidateDraftPayloadSchema,
  coerceCandidateDraftPayload,
  type CandidateDraft
} from "./candidate-schema";

type GenerateCandidateDraftsInput = {
  goal: GoalCard;
  item: SearchPlanItem;
};

type MoonshotToolsPayload = {
  tools?: OpenAI.Chat.ChatCompletionTool[];
};

type MoonshotFiberPayload = {
  status?: string;
  error?: string;
  context?: {
    output?: string;
    encrypted_output?: string;
    error?: string;
  };
};

const MOONSHOT_WEB_SEARCH_FORMULA_URI = "moonshot/web-search:latest";

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

function getSearchModel() {
  return process.env.OPENAI_SEARCH_MODEL ?? process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini";
}

function getMoonshotToolBaseURLs() {
  const configured = normalizeBaseURL(process.env.OPENAI_BASE_URL) ?? "";
  const aiFallback =
    configured.includes("api.moonshot.cn")
      ? configured.replace("api.moonshot.cn", "api.moonshot.ai")
      : "";

  return Array.from(
    new Set([configured, aiFallback, "https://api.moonshot.ai/v1"].filter(Boolean))
  );
}

function shouldUseMoonshotWebSearch() {
  return getOpenAIProvider(getSearchModel()) === "moonshot";
}

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    throw new Error("Candidate recall JSON was not found in the model response.");
  }

  return withoutFence.slice(start, end + 1);
}

function parseCandidateDrafts(raw: string) {
  const drafts = coerceCandidateDraftPayload(JSON.parse(extractJsonObject(raw)));

  if (!drafts) {
    throw new Error("Candidate recall draft validation failed.");
  }

  return drafts;
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
      new Set(
        item.dimensionId
          ? [...draft.strengthDimensions, item.dimensionId]
          : draft.strengthDimensions
      )
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

async function fetchMoonshotTools(apiKey: string) {
  const failures: string[] = [];

  for (const baseURL of getMoonshotToolBaseURLs()) {
    try {
      const response = await fetch(
        `${baseURL}/formulas/${MOONSHOT_WEB_SEARCH_FORMULA_URI}/tools`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      );

      if (!response.ok) {
        failures.push(`${baseURL}: ${response.status} ${await response.text()}`);
        continue;
      }

      const payload = (await response.json()) as MoonshotToolsPayload;

      if (Array.isArray(payload.tools) && payload.tools.length > 0) {
        return {
          baseURL,
          tools: payload.tools
        };
      }

      failures.push(`${baseURL}: invalid tools payload`);
    } catch (error) {
      failures.push(
        `${baseURL}: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  }

  throw new Error(
    `Kimi 联网工具初始化失败：${failures[0] ?? "未拿到可用的 web-search 工具定义。"}`
  );
}

async function runMoonshotFiber(input: {
  apiKey: string;
  baseURL: string;
  toolCall: OpenAI.Chat.ChatCompletionMessageFunctionToolCall;
}) {
  const response = await fetch(
    `${input.baseURL}/formulas/${MOONSHOT_WEB_SEARCH_FORMULA_URI}/fibers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`
      },
      body: JSON.stringify({
        name: input.toolCall.function.name,
        arguments: input.toolCall.function.arguments
      })
    }
  );

  if (!response.ok) {
    return `Error: ${response.status} ${await response.text()}`;
  }

  const payload = (await response.json()) as MoonshotFiberPayload;
  const output =
    payload.context?.output ??
    payload.context?.encrypted_output ??
    payload.context?.error ??
    payload.error;

  if (typeof output === "string" && output.trim()) {
    return output;
  }

  return "Error: Kimi web-search tool returned no usable output.";
}

async function generateCandidateDraftsViaResponses(input: GenerateCandidateDraftsInput) {
  const response = await getOpenAIClient().responses.create({
    model: getSearchModel(),
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

  return parseCandidateDrafts(response.output_text);
}

async function generateCandidateDraftsViaChatCompletions(input: GenerateCandidateDraftsInput) {
  const response = await getOpenAIClient().chat.completions.create({
    model: getSearchModel(),
    messages: [
      {
        role: "system",
        content: [
          "Generate candidate product drafts as strict JSON.",
          "Return exactly one object with a candidates array.",
          "Each candidate must include name, officialUrl, strengthDimensions, sources.",
          "Only keep sourceType values from official_site, docs, pricing, review.",
          "If you are not confident about a URL, set officialUrl to null and omit that source.",
          "If external web search is unavailable, rely on broadly known public products and return fewer candidates instead of guessing.",
          "Return JSON only and do not wrap it in markdown."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          goal: input.goal,
          searchItem: input.item
        })
      }
    ]
  });

  const content = response.choices[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Candidate recall response was empty.");
  }

  return parseCandidateDrafts(content);
}

async function generateCandidateDraftsViaMoonshot(input: GenerateCandidateDraftsInput) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for Kimi web search.");
  }

  const { baseURL, tools } = await fetchMoonshotTools(apiKey);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: [
        "Use the Moonshot official web-search tool to find public product candidates.",
        "Return strict JSON only.",
        "The final JSON must be an object with a candidates array.",
        "Each candidate must include name, officialUrl, strengthDimensions, sources.",
        "Only keep sourceType values from official_site, docs, pricing, review.",
        "Prefer official URLs when available and do not invent URLs.",
        "If evidence is weak, return fewer candidates instead of guessing."
      ].join(" ")
    },
    {
      role: "user",
      content: JSON.stringify({
        goal: input.goal,
        searchItem: input.item
      })
    }
  ];

  async function requestFinalJson() {
    const response = await getOpenAIClient().chat.completions.create({
      model: getSearchModel(),
      messages: [
        ...messages,
        {
          role: "system",
          content: [
            "You already have the available web search results in the conversation.",
            "Do not call any more tools.",
            "Now return the final candidate JSON only."
          ].join(" ")
        }
      ]
    });
    const content = response.choices[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Candidate recall response was empty.");
    }

    return parseCandidateDrafts(content);
  }

  for (let round = 0; round < 6; round += 1) {
    const response = await getOpenAIClient().chat.completions.create({
      model: getSearchModel(),
      messages,
      tools
    });
    const message = response.choices[0]?.message;

    if (!message) {
      throw new Error("Candidate recall response was empty.");
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
      // Kimi thinking models require the original assistant message, including
      // runtime-only fields like reasoning_content, to be preserved across
      // multi-step tool calls.
      messages.push(message as unknown as OpenAI.Chat.ChatCompletionAssistantMessageParam);

      for (const toolCall of message.tool_calls) {
        if (toolCall.type !== "function") {
          continue;
        }

        const toolResult = await runMoonshotFiber({
          apiKey,
          baseURL,
          toolCall
        });
        const toolMessage: OpenAI.Chat.ChatCompletionToolMessageParam = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult
        };

        messages.push(toolMessage);
      }

      try {
        return await requestFinalJson();
      } catch (finalizationError) {
        if (round >= 5) {
          throw finalizationError;
        }
      }

      continue;
    }

    const content = message.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Candidate recall response was empty.");
    }

    return parseCandidateDrafts(content);
  }

  return requestFinalJson();
}

export async function generateCandidateDrafts(input: GenerateCandidateDraftsInput) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockDrafts(input.item).map((draft) => toCandidate(draft, input.item));
  }

  let drafts: CandidateDraft[];

  if (shouldUseMoonshotWebSearch()) {
    drafts = await generateCandidateDraftsViaMoonshot(input);
  } else if (supportsResponsesWebSearch(getSearchModel())) {
    try {
      drafts = await generateCandidateDraftsViaResponses(input);
    } catch (error) {
      if (!shouldFallbackToChatCompletions(error)) {
        throw error;
      }

      drafts = await generateCandidateDraftsViaChatCompletions(input);
    }
  } else {
    drafts = await generateCandidateDraftsViaChatCompletions(input);
  }

  return drafts.map((draft) => toCandidate(draft, input.item));
}
