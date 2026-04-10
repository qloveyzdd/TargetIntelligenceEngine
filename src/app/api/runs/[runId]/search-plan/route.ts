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
  try {
    const { runId } = await context.params;
    const run = await getRunById(runId);

    if (!run) {
      return Response.json({ error: "未找到该运行记录。" }, { status: 404 });
    }

    if (!run.goal || !canGenerateSearchPlan(run.status)) {
      return Response.json(
        { error: "生成搜索计划前，必须先确认维度。" },
        { status: 400 }
      );
    }

    const enabledDimensions = run.dimensions.filter((dimension) => dimension.enabled);

    if (enabledDimensions.length === 0) {
      return Response.json(
        { error: "生成搜索计划前，至少要启用一个维度。" },
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成搜索计划失败。";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "未找到该运行记录。" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as UpdateSearchPlanRequest;
    const searchPlan = coerceSearchPlan(body.searchPlan ?? body);

    if (!searchPlan) {
      return Response.json({ error: "搜索计划数据无效。" }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "更新搜索计划失败。";

    return Response.json({ error: message }, { status: 400 });
  }
}
