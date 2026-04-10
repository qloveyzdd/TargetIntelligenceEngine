import type { GoalCard } from "@/features/analysis-run/types";
import {
  getOpenAIClient,
  shouldFallbackToChatCompletions,
  shouldUseChatCompletionsForStructuredJson
} from "@/lib/openai";
import { normalizeGoalInput } from "./normalize-goal-input";
import { coerceGoalCard, goalCardSchema, goalStageValues } from "./schema";

function buildMockGoalCard(inputText: string, inputNotes: string | null): GoalCard {
  const focus = inputText.split(/[,.!?;\n]/)[0]?.trim() || "Target Initiative";

  return {
    name: focus,
    category: "AI Product Tool",
    jobToBeDone: inputText,
    hardConstraints: inputNotes ? [inputNotes] : [],
    softPreferences: ["Explainable results", "Easy follow-up planning"],
    currentStage: "validation"
  };
}

function getGoalCardModel() {
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
    throw new Error("GoalCard JSON was not found in the model response.");
  }

  return withoutFence.slice(start, end + 1);
}

function parseGoalCard(raw: string) {
  const goalCard = coerceGoalCard(JSON.parse(extractJsonObject(raw)));

  if (!goalCard) {
    throw new Error("GoalCard validation failed.");
  }

  return goalCard;
}

async function generateGoalCardViaResponses(input: {
  inputText: string;
  inputNotes: string | null;
}) {
  const response = await getOpenAIClient().responses.create({
    model: getGoalCardModel(),
    instructions:
      "Convert the user input into a strict GoalCard object. Follow the JSON schema exactly and do not return extra prose.",
    input: JSON.stringify(input),
    text: {
      format: {
        type: "json_schema",
        name: "goal_card",
        strict: true,
        schema: goalCardSchema
      }
    }
  });

  return parseGoalCard(response.output_text);
}

async function generateGoalCardViaChatCompletions(input: {
  inputText: string;
  inputNotes: string | null;
}) {
  const response = await getOpenAIClient().chat.completions.create({
    model: getGoalCardModel(),
    messages: [
      {
        role: "system",
        content: [
          "Convert the user input into a strict GoalCard JSON object.",
          "Return JSON only and do not wrap it in markdown.",
          "Use exactly these keys: name, category, jobToBeDone, hardConstraints, softPreferences, currentStage.",
          `currentStage must be one of: ${goalStageValues.join(", ")}.`,
          "hardConstraints and softPreferences must be arrays of strings.",
          "Do not add extra keys."
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
    throw new Error("GoalCard response was empty.");
  }

  return parseGoalCard(content);
}

export async function generateGoalCard(input: {
  inputText: string;
  inputNotes?: string | null;
}) {
  const normalized = normalizeGoalInput(input);

  if (!normalized.inputText) {
    throw new Error("inputText is required.");
  }

  if (process.env.MOCK_OPENAI === "true") {
    return buildMockGoalCard(normalized.inputText, normalized.inputNotes);
  }

  if (shouldUseChatCompletionsForStructuredJson(getGoalCardModel())) {
    return generateGoalCardViaChatCompletions(normalized);
  }

  try {
    return await generateGoalCardViaResponses(normalized);
  } catch (error) {
    if (!shouldFallbackToChatCompletions(error)) {
      throw error;
    }

    return generateGoalCardViaChatCompletions(normalized);
  }
}
