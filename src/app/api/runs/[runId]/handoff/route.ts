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
    return Response.json({ error: "未找到该运行记录。" }, { status: 404 });
  }

  if (!run.scoring || run.stageGoals.length === 0) {
    return Response.json(
      { error: "导出交接结果前，必须先有已保存的评分和阶段目标。" },
      { status: 400 }
    );
  }

  return Response.json({
    handoff: buildStageGoalHandoff(run)
  });
}
