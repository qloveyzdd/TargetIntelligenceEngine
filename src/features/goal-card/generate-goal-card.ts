import type { GoalCard } from "@/features/analysis-run/types";
import { getOpenAIClient } from "@/lib/openai";
import { normalizeGoalInput } from "./normalize-goal-input";
import { coerceGoalCard, goalCardSchema } from "./schema";

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

  const response = await getOpenAIClient().responses.create({
    model: process.env.OPENAI_GOAL_MODEL ?? "gpt-5.4-mini",
    instructions:
      "Convert the user input into a strict GoalCard object. Follow the JSON schema exactly and do not return extra prose.",
    input: JSON.stringify(normalized),
    text: {
      format: {
        type: "json_schema",
        name: "goal_card",
        strict: true,
        schema: goalCardSchema
      }
    }
  });

  const goalCard = coerceGoalCard(JSON.parse(response.output_text));

  if (!goalCard) {
    throw new Error("GoalCard validation failed.");
  }

  return goalCard;
}
