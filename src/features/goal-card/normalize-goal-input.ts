export type GoalInput = {
  inputText: string;
  inputNotes?: string | null;
};

export function normalizeGoalInput(input: GoalInput) {
  return {
    inputText: input.inputText.trim(),
    inputNotes: input.inputNotes?.trim() || null
  };
}
