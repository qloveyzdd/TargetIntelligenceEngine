import { getRunById } from "@/features/analysis-run/repository";
import { buildStageGoalHandoff } from "@/features/stage-goals/build-stage-goal-handoff";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  if (!run.scoring || run.stageGoals.length === 0) {
    return Response.json(
      { error: "Persisted scoring and stage goals are required before exporting handoff." },
      { status: 400 }
    );
  }

  return Response.json({
    handoff: buildStageGoalHandoff(run)
  });
}
