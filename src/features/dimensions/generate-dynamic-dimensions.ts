import type { Dimension, GoalCard } from "@/features/analysis-run/types";
import {
  getOpenAIClient,
  shouldFallbackToChatCompletions,
  shouldUseChatCompletionsForStructuredJson
} from "@/lib/openai";
import {
  coerceDynamicDimensionPayload,
  dynamicDimensionSchema
} from "./dimension-schema";

type GenerateDynamicDimensionsInput = {
  goal: GoalCard;
  coreDimensions: Dimension[];
};

function makeDimension(
  id: string,
  name: string,
  definition: string,
  evidenceNeeded: string[],
  layer: "domain" | "project",
  weight: number
): Dimension {
  return {
    id,
    name,
    weight,
    direction: "higher_better",
    definition,
    evidenceNeeded,
    layer,
    enabled: true
  };
}

function collectGoalText(goal: GoalCard) {
  return [
    goal.name,
    goal.category,
    goal.jobToBeDone,
    ...goal.hardConstraints,
    ...goal.softPreferences
  ]
    .join(" ")
    .toLowerCase();
}

function buildMockDimensions(goal: GoalCard) {
  const goalText = collectGoalText(goal);
  const domainDimensions: Dimension[] = /(ai|model|llm|agent|prompt|knowledge|context)/.test(
    goalText
  )
    ? [
        makeDimension(
          "model-quality",
          "模型质量",
          "底层模型的能力是否足够强，输出结果是否稳定且可信。",
          ["quality_signal", "model_info"],
          "domain",
          0.12
        ),
        makeDimension(
          "context-handling",
          "上下文处理",
          "产品是否能稳定处理长上下文，以及多步骤任务的连续性。",
          ["context_window", "workflow"],
          "domain",
          0.11
        ),
        makeDimension(
          "knowledge-access",
          "知识接入",
          "连接外部知识、内部资料和参考信息的能力是否顺畅。",
          ["knowledge_connectors", "docs"],
          "domain",
          0.11
        )
      ]
    : [
        makeDimension(
          "integration-depth",
          "集成深度",
          "产品接入周边工具链和现有工作流的能力是否足够完善。",
          ["integrations", "api"],
          "domain",
          0.12
        ),
        makeDimension(
          "automation-support",
          "自动化支持",
          "产品能够替代多少重复劳动，自动化能力是否实用。",
          ["automation", "workflow"],
          "domain",
          0.11
        )
      ];

  const projectDimensions: Dimension[] = [];

  if (/(private|self-host|on-prem|deployment)/.test(goalText)) {
    projectDimensions.push(
      makeDimension(
        "private-deployment",
        "私有部署",
        "产品是否支持自托管、内网部署或更可控的交付方式。",
        ["deployment_mode", "security"],
        "project",
        0.1
      )
    );
  }

  if (/(small team|lean team|small-team|startup|open source)/.test(goalText)) {
    projectDimensions.push(
      makeDimension(
        "small-team-fit",
        "小团队适配",
        "对资源有限的小团队来说，使用和维护成本是否足够可控。",
        ["pricing", "setup_time"],
        "project",
        0.09
      )
    );
  }

  if (/(evidence|explainable|traceable|citation)/.test(goalText)) {
    projectDimensions.push(
      makeDimension(
        "evidence-traceability",
        "证据可追溯",
        "产品是否能把结论、推荐和明确证据链稳定关联起来。",
        ["citations", "evidence_chain"],
        "project",
        0.09
      )
    );
  }

  if (projectDimensions.length === 0) {
    projectDimensions.push(
      makeDimension(
        "decision-focus",
        "决策聚焦",
        "产品是否始终围绕当前目标推进，而不是让信息发散失焦。",
        ["workflow", "task_scope"],
        "project",
        0.09
      )
    );
  }

  return [...domainDimensions, ...projectDimensions.slice(0, 3)];
}

function getDimensionModel() {
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
    throw new Error("Dynamic dimension JSON was not found in the model response.");
  }

  return withoutFence.slice(start, end + 1);
}

function parseDynamicDimensions(raw: string) {
  const dimensions = coerceDynamicDimensionPayload(JSON.parse(extractJsonObject(raw)));

  if (!dimensions) {
    throw new Error("Dynamic dimension validation failed.");
  }

  return dimensions;
}

async function generateDimensionsViaResponses(input: GenerateDynamicDimensionsInput) {
  const response = await getOpenAIClient().responses.create({
    model: getDimensionModel(),
    instructions:
      "Generate only domain and project dimensions for this GoalCard. Keep core dimensions untouched. The dimension name and definition must be in Chinese. Return strict JSON only.",
    input: JSON.stringify(input),
    text: {
      format: {
        type: "json_schema",
        name: "dynamic_dimensions",
        strict: true,
        schema: dynamicDimensionSchema
      }
    }
  });

  return parseDynamicDimensions(response.output_text);
}

async function generateDimensionsViaChatCompletions(input: GenerateDynamicDimensionsInput) {
  const response = await getOpenAIClient().chat.completions.create({
    model: getDimensionModel(),
    messages: [
      {
        role: "system",
        content: [
          "Generate only dynamic dimensions as strict JSON.",
          "Return exactly one object with a dimensions array.",
          "Every dimension must include id, name, weight, direction, definition, evidenceNeeded, layer, enabled.",
          "layer must be either domain or project.",
          "Do not include any core dimensions.",
          "The name and definition fields must be written in Chinese.",
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
    throw new Error("Dynamic dimension response was empty.");
  }

  return parseDynamicDimensions(content);
}

export async function generateDynamicDimensions(input: GenerateDynamicDimensionsInput) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockDimensions(input.goal);
  }

  if (shouldUseChatCompletionsForStructuredJson(getDimensionModel())) {
    return generateDimensionsViaChatCompletions(input);
  }

  try {
    return await generateDimensionsViaResponses(input);
  } catch (error) {
    if (!shouldFallbackToChatCompletions(error)) {
      throw error;
    }

    return generateDimensionsViaChatCompletions(input);
  }
}
