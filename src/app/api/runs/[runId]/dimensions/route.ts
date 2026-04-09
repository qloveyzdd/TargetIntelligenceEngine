import { buildInitialDimensions } from "@/features/dimensions/build-initial-dimensions";
import { coerceDimensions } from "@/features/dimensions/dimension-schema";
import { generateDynamicDimensions } from "@/features/dimensions/generate-dynamic-dimensions";
import { mergeDimensions } from "@/features/dimensions/merge-dimensions";
import { normalizeDimensionWeights } from "@/features/dimensions/normalize-dimension-weights";
import { getRunById, updateRunAggregate } from "@/features/analysis-run/repository";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

type GenerateDimensionsRequest = {
  forceRegenerate?: boolean;
};

type UpdateDimensionsRequest = {
  dimensions?: unknown;
};

function canGenerateDimensions(status: string) {
  return (
    status === "goal_confirmed" ||
    status === "dimensions_ready" ||
    status === "search_plan_ready" ||
    status === "search_plan_confirmed"
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  if (!run.goal || !canGenerateDimensions(run.status)) {
    return Response.json(
      { error: "A confirmed GoalCard is required before generating dimensions." },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as GenerateDimensionsRequest;
  const hasDynamicDimensions = run.dimensions.some((dimension) => dimension.layer !== "core");

  if (hasDynamicDimensions && !body.forceRegenerate) {
    return Response.json({ run });
  }

  const coreDimensions =
    run.dimensions.filter((dimension) => dimension.layer === "core").length > 0
      ? run.dimensions.filter((dimension) => dimension.layer === "core")
      : buildInitialDimensions(run.goal);
  const dynamicDimensions = await generateDynamicDimensions({
    goal: run.goal,
    coreDimensions
  });
  const dimensions = normalizeDimensionWeights(
    mergeDimensions(coreDimensions, dynamicDimensions)
  );
  const nextRun = await updateRunAggregate(runId, {
    dimensions,
    searchPlan: null,
    status: "goal_confirmed"
  });

  return Response.json({ run: nextRun });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as UpdateDimensionsRequest;
    const dimensions = coerceDimensions(body.dimensions);

    if (!dimensions) {
      return Response.json({ error: "Dimensions payload is invalid." }, { status: 400 });
    }

    const nextRun = await updateRunAggregate(runId, {
      dimensions: normalizeDimensionWeights(dimensions),
      searchPlan: null,
      status: "dimensions_ready"
    });

    return Response.json({ run: nextRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update dimensions.";

    return Response.json({ error: message }, { status: 400 });
  }
}
