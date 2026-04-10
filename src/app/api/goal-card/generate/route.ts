import { generateGoalCard } from "@/features/goal-card/generate-goal-card";

type GenerateGoalCardRequest = {
  inputText?: string;
  inputNotes?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateGoalCardRequest;
    const goal = await generateGoalCard({
      inputText: body.inputText ?? "",
      inputNotes: body.inputNotes ?? null
    });

    return Response.json({ goal });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成 GoalCard 失败。";

    return Response.json({ error: message }, { status: 400 });
  }
}
