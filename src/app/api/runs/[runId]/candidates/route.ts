import { getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { generateCandidateDrafts } from "@/features/candidate-recall/generate-candidate-drafts";
import { normalizeCandidates } from "@/features/candidate-recall/normalize-candidates";
import { selectTopCandidates } from "@/features/candidate-recall/select-top-candidates";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

type GenerateCandidatesRequest = {
  forceRegenerate?: boolean;
};

function canGenerateCandidates(status: string) {
  return (
    status === "search_plan_confirmed" ||
    status === "candidates_ready" ||
    status === "evidence_ready"
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "未找到该运行记录。" }, { status: 404 });
  }

  if (
    !run.goal ||
    !run.searchPlan ||
    run.searchPlan.status !== "confirmed" ||
    !canGenerateCandidates(run.status)
  ) {
    return Response.json(
      { error: "生成候选前，必须先确认检索计划。" },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as GenerateCandidatesRequest;

  if (run.candidates.length > 0 && !body.forceRegenerate) {
    return Response.json({ run });
  }

  const drafts = await Promise.all(
    run.searchPlan.items.map((item) =>
      generateCandidateDrafts({
        goal: run.goal!,
        item
      })
    )
  );
  const candidates = selectTopCandidates(normalizeCandidates(drafts.flat()));
  const nextRun = await updateRunAggregate(runId, {
    status: "candidates_ready",
    candidates,
    evidence: []
  });

  return Response.json({ run: nextRun });
}
