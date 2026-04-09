import { getRunById, updateRunAggregate } from "@/features/analysis-run/repository";
import { buildGapPriorities } from "@/features/scoring/build-gap-priorities";
import { buildScoringSnapshot } from "@/features/scoring/build-scoring-snapshot";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

type GenerateScoringRequest = {
  forceRegenerate?: boolean;
};

function canGenerateScoring(status: string) {
  return status === "evidence_ready";
}

export async function POST(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRunById(runId);

  if (!run) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  if (!canGenerateScoring(run.status) || run.candidates.length === 0 || run.evidence.length === 0) {
    return Response.json(
      { error: "Persisted evidence is required before generating scoring." },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as GenerateScoringRequest;

  if (run.scoring && !body.forceRegenerate && run.scoring.gaps.length > 0) {
    return Response.json({ run });
  }

  const scoringSnapshot =
    run.scoring && !body.forceRegenerate
      ? run.scoring
      : await buildScoringSnapshot({
          candidates: run.candidates,
          dimensions: run.dimensions,
          evidence: run.evidence
        });
  const scoring = {
    ...scoringSnapshot,
    gaps: buildGapPriorities({
      scoring: scoringSnapshot,
      candidates: run.candidates,
      dimensions: run.dimensions
    })
  };
  const nextRun = await updateRunAggregate(runId, {
    scoring
  });

  return Response.json({ run: nextRun });
}
