import { getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildInitialDimensions } from "@/features/dimensions/build-initial-dimensions";
import { coerceGoalCard } from "@/features/goal-card/schema";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

type UpdateRunRequest = {
  status?: "draft" | "goal_ready" | "goal_confirmed";
  inputNotes?: string | null;
  goal?: unknown;
};

export async function GET(_request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  return Response.json({ run });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const currentRun = await getRunById(runId);

  if (!currentRun) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as UpdateRunRequest;
    const nextStatus = body.status ?? currentRun.status;
    const nextGoal = body.goal === undefined ? currentRun.goal : coerceGoalCard(body.goal);

    if (body.goal !== undefined && !nextGoal) {
      return Response.json({ error: "GoalCard payload is invalid." }, { status: 400 });
    }

    if (nextStatus === "goal_confirmed" && !nextGoal) {
      return Response.json(
        { error: "A valid GoalCard is required before confirmation." },
        { status: 400 }
      );
    }

    const nextDimensions =
      nextStatus === "goal_confirmed" &&
      nextGoal &&
      currentRun.dimensions.length === 0
        ? buildInitialDimensions(nextGoal)
        : currentRun.dimensions;

    const run = await updateRunAggregate(runId, {
      goal: nextGoal,
      status: nextStatus,
      inputNotes:
        body.inputNotes === undefined ? currentRun.inputNotes : body.inputNotes ?? null,
      dimensions: nextDimensions
    });

    return Response.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update the run.";

    return Response.json({ error: message }, { status: 400 });
  }
}
