import type { Dimension, GoalCard } from "@/features/analysis-run/types";
import { getOpenAIClient } from "@/lib/openai";
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
          "Model Quality",
          "How strong the underlying model quality and answer fidelity are.",
          ["quality_signal", "model_info"],
          "domain",
          0.12
        ),
        makeDimension(
          "context-handling",
          "Context Handling",
          "How well the product handles long context and multi-step task continuity.",
          ["context_window", "workflow"],
          "domain",
          0.11
        ),
        makeDimension(
          "knowledge-access",
          "Knowledge Access",
          "How easily the product connects external knowledge and internal references.",
          ["knowledge_connectors", "docs"],
          "domain",
          0.11
        )
      ]
    : [
        makeDimension(
          "integration-depth",
          "Integration Depth",
          "How well the product plugs into surrounding tools and workflows.",
          ["integrations", "api"],
          "domain",
          0.12
        ),
        makeDimension(
          "automation-support",
          "Automation Support",
          "How much repetitive work the product can automate.",
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
        "Private Deployment",
        "How well the product supports self-hosted or controlled deployment modes.",
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
        "Small Team Fit",
        "How manageable the product is for a lean team with limited operating overhead.",
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
        "Evidence Traceability",
        "How well the product keeps recommendations tied to explicit sources and rationale.",
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
        "Decision Focus",
        "How well the product keeps the experience aligned with the current project goal.",
        ["workflow", "task_scope"],
        "project",
        0.09
      )
    );
  }

  return [...domainDimensions, ...projectDimensions.slice(0, 3)];
}

export async function generateDynamicDimensions(input: GenerateDynamicDimensionsInput) {
  if (process.env.MOCK_OPENAI === "true") {
    return buildMockDimensions(input.goal);
  }

  const response = await getOpenAIClient().responses.create({
    model: process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini",
    instructions:
      "Generate only domain and project dimensions for this GoalCard. Keep core dimensions untouched and return strict JSON only.",
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

  const dimensions = coerceDynamicDimensionPayload(JSON.parse(response.output_text));

  if (!dimensions) {
    throw new Error("Dynamic dimension validation failed.");
  }

  return dimensions;
}
