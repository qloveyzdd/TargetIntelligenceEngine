import { getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildSearchPlanInput } from "@/features/search-plan/build-search-plan-input";
import { generateSearchPlan } from "@/features/search-plan/generate-search-plan";
import { coerceSearchPlan } from "@/features/search-plan/schema";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

type GenerateSearchPlanRequest = {
  forceRegenerate?: boolean;
};

type UpdateSearchPlanRequest = {
  searchPlan?: unknown;
};

function canGenerateSearchPlan(status: string) {
  return (
    status === "dimensions_ready" ||
    status === "search_plan_ready" ||
    status === "search_plan_confirmed" ||
    status === "candidates_ready" ||
    status === "evidence_ready"
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  if (!run.goal || !canGenerateSearchPlan(run.status)) {
    return Response.json(
      { error: "Confirmed dimensions are required before generating a search plan." },
      { status: 400 }
    );
  }

  const enabledDimensions = run.dimensions.filter((dimension) => dimension.enabled);

  if (enabledDimensions.length === 0) {
    return Response.json(
      { error: "At least one enabled dimension is required before generating a search plan." },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as GenerateSearchPlanRequest;

  if (run.searchPlan && !body.forceRegenerate) {
    return Response.json({ run });
  }

  const items = await generateSearchPlan(
    buildSearchPlanInput({
      goal: run.goal,
      dimensions: run.dimensions
    })
  );
  const nextRun = await updateRunAggregate(runId, {
    status: "search_plan_ready",
    searchPlan: {
      status: "draft",
      items,
      confirmedAt: null
    },
    candidates: [],
    evidence: []
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
    const body = (await request.json()) as UpdateSearchPlanRequest;
    const searchPlan = coerceSearchPlan(body.searchPlan ?? body);

    if (!searchPlan) {
      return Response.json({ error: "Search plan payload is invalid." }, { status: 400 });
    }

    const nextRun = await updateRunAggregate(runId, {
      status: "search_plan_confirmed",
      searchPlan: {
        ...searchPlan,
        status: "confirmed",
        confirmedAt: new Date().toISOString()
      },
      candidates: [],
      evidence: []
    });

    return Response.json({ run: nextRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update the search plan.";

    return Response.json({ error: message }, { status: 400 });
  }
}
