import { getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildEvidenceSourceTasks } from "@/features/evidence/build-evidence-source-tasks";
import { extractEvidence } from "@/features/evidence/extract-evidence";
import { loadPageText } from "@/features/evidence/load-page-text";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

type GenerateEvidenceRequest = {
  forceRegenerate?: boolean;
};

function canGenerateEvidence(status: string) {
  return status === "candidates_ready" || status === "evidence_ready";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { runId } = await context.params;
    const run = await getRunById(runId);

    if (!run) {
      return Response.json({ error: "未找到该运行记录。" }, { status: 404 });
    }

    if (!canGenerateEvidence(run.status) || run.candidates.length === 0) {
      return Response.json(
        { error: "生成证据前，必须先有已保存的候选结果。" },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as GenerateEvidenceRequest;

    if (run.evidence.length > 0 && !body.forceRegenerate) {
      return Response.json({ run });
    }

    const tasks = buildEvidenceSourceTasks({
      candidates: run.candidates,
      dimensions: run.dimensions
    });
    const dimensionsById = new Map(run.dimensions.map((dimension) => [dimension.id, dimension]));
    const candidatesById = new Map(run.candidates.map((candidate) => [candidate.id, candidate]));
    const pageTextCache = new Map<string, string>();
    const evidence = [];

    for (const task of tasks) {
      const candidate = candidatesById.get(task.candidateId);
      const dimension = dimensionsById.get(task.dimensionId);

      if (!candidate || !dimension) {
        continue;
      }

      let pageText = pageTextCache.get(task.url);

      if (pageText === undefined) {
        pageText = await loadPageText(task.url);
        pageTextCache.set(task.url, pageText);
      }

      if (!pageText.trim()) {
        continue;
      }

      try {
        evidence.push(
          ...(await extractEvidence({
            candidate,
            dimension,
            task,
            pageText
          }))
        );
      } catch (error) {
        console.warn(
          "[evidence] skip task",
          JSON.stringify({
            candidateId: task.candidateId,
            dimensionId: task.dimensionId,
            sourceType: task.sourceType,
            url: task.url,
            message: error instanceof Error ? error.message : "unknown error"
          })
        );
      }
    }

    const nextRun = await updateRunAggregate(runId, {
      status: "evidence_ready",
      evidence
    });

    return Response.json({ run: nextRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成证据失败。";

    return Response.json({ error: message }, { status: 500 });
  }
}
