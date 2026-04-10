import type { AnalysisRun, CandidateScorecard } from "@/features/analysis-run/types";
import type { RadarChartModel, RadarSeries } from "./radar-types";
import { selectRadarCandidates } from "./select-radar-candidates";

type BuildRadarChartModelInput = {
  run: AnalysisRun;
  selectedCandidateIds?: string[];
};

function buildGoalSeries(run: AnalysisRun): RadarSeries {
  const enabledDimensions = run.dimensions.filter((dimension) => dimension.enabled);

  return {
    id: "goal",
    label: run.goal?.name ?? "当前目标",
    kind: "goal",
    candidateId: null,
    overallScore: 100,
    coverage: enabledDimensions.length > 0 ? 1 : 0,
    unknownCount: 0,
    matchedModes: [],
    // Goal series is a desired silhouette instead of a re-scored candidate.
    values: enabledDimensions.map((dimension) => ({
      dimensionId: dimension.id,
      label: dimension.name,
      status: "known",
      value: 100,
      coverage: 1,
      evidenceIds: [],
      summary: `目标画像会将 ${dimension.name} 维持在理想上限。`
    }))
  };
}

function buildCandidateSeries(
  run: AnalysisRun,
  scorecard: CandidateScorecard
): RadarSeries | null {
  const candidate = run.candidates.find((item) => item.id === scorecard.candidateId);

  if (!candidate) {
    return null;
  }

  return {
    id: `candidate:${candidate.id}`,
    label: candidate.name,
    kind: "candidate",
    candidateId: candidate.id,
    overallScore: scorecard.overallScore,
    coverage: scorecard.coverage,
    unknownCount: scorecard.unknownCount,
    matchedModes: candidate.matchedModes,
    values: run.dimensions
      .filter((dimension) => dimension.enabled)
      .map((dimension) => {
        const dimensionScorecard = scorecard.dimensionScorecards.find(
          (item) => item.dimensionId === dimension.id
        );

        return {
          dimensionId: dimension.id,
          label: dimension.name,
          status: dimensionScorecard?.status ?? "unknown",
          value: dimensionScorecard?.status === "known" ? dimensionScorecard.score : null,
          coverage: dimensionScorecard?.coverage ?? 0,
          evidenceIds: dimensionScorecard?.evidenceIds ?? [],
          summary:
            dimensionScorecard?.summary ??
            `当前还没有 ${dimension.name} 的证据支撑分数。`
        };
      })
  };
}

export function buildRadarChartModel(
  input: BuildRadarChartModelInput
): RadarChartModel | null {
  const { run } = input;

  if (!run.scoring) {
    return null;
  }

  const enabledDimensions = run.dimensions.filter((dimension) => dimension.enabled);

  if (enabledDimensions.length === 0) {
    return null;
  }

  const selection = selectRadarCandidates({
    candidates: run.candidates,
    scoring: run.scoring,
    selectedCandidateIds: input.selectedCandidateIds
  });
  const scorecardsByCandidateId = new Map(
    run.scoring.candidateScorecards.map((scorecard) => [scorecard.candidateId, scorecard])
  );
  const goalSeries = buildGoalSeries(run);
  const candidateSeries = selection.selectedCandidateIds
    .map((candidateId) => {
      const scorecard = scorecardsByCandidateId.get(candidateId);

      if (!scorecard) {
        return null;
      }

      return buildCandidateSeries(run, scorecard);
    })
    .filter((series): series is RadarSeries => series !== null);

  return {
    goalLabel: goalSeries.label,
    axes: enabledDimensions.map((dimension) => ({
      dimensionId: dimension.id,
      label: dimension.name,
      definition: dimension.definition,
      direction: dimension.direction,
      weight: dimension.weight,
      max: 100
    })),
    series: [goalSeries, ...candidateSeries],
    selection
  };
}
