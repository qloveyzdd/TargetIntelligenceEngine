import { getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildStageGoals } from "@/features/stage-goals/build-stage-goals";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

type GenerateStageGoalsRequest = {
  forceRegenerate?: boolean;
};

export async function POST(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "未找到该运行记录。" }, { status: 404 });
  }

  if (!run.scoring) {
    return Response.json(
      { error: "生成阶段目标前，必须先有已保存的评分结果。" },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as GenerateStageGoalsRequest;

  if (run.stageGoals.length > 0 && !body.forceRegenerate) {
    return Response.json({ run });
  }

  const stageGoals = buildStageGoals({
    goal: run.goal,
    dimensions: run.dimensions,
    candidates: run.candidates,
    scoring: run.scoring
  });
  const nextRun = await updateRunAggregate(runId, {
    stageGoals
  });

  return Response.json({ run: nextRun });
}
