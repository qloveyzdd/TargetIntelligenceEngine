import type {
  AnalysisRunScoring,
  Candidate,
  Dimension,
  GapPriority
} from "@/features/analysis-run/types";

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildGapPriorities(input: {
  scoring: AnalysisRunScoring;
  candidates: Candidate[];
  dimensions: Dimension[];
}) {
  const candidatesById = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
  const scorecardsByCandidate = new Map(
    input.scoring.candidateScorecards.map((scorecard) => [scorecard.candidateId, scorecard])
  );

  const gaps: GapPriority[] = input.dimensions
    .filter((dimension) => dimension.enabled)
    .map((dimension) => {
      const knownScores = input.scoring.candidateScorecards
        .map((candidateScorecard) => {
          const dimensionScorecard = candidateScorecard.dimensionScorecards.find(
            (item) => item.dimensionId === dimension.id
          );

          if (!dimensionScorecard || dimensionScorecard.status !== "known" || dimensionScorecard.score === null) {
            return null;
          }

          return {
            candidateId: candidateScorecard.candidateId,
            candidateCoverage: candidateScorecard.coverage,
            scorecard: dimensionScorecard
          };
        })
        .filter(
          (
            item
          ): item is {
            candidateId: string;
            candidateCoverage: number;
            scorecard: NonNullable<
              (typeof input.scoring.candidateScorecards)[number]["dimensionScorecards"][number]
            >;
          } => item !== null
        )
        .sort((left, right) => (right.scorecard.score ?? 0) - (left.scorecard.score ?? 0));

      const benchmark = knownScores[0];

      if (!benchmark || benchmark.scorecard.evidenceIds.length === 0) {
        return {
          dimensionId: dimension.id,
          status: "unknown",
          benchmarkCandidateId: null,
          benchmarkCandidateName: null,
          benchmarkMatchedModes: [],
          benchmarkEvidenceIds: [],
          benchmarkScore: null,
          baselineScore: null,
          gapSize: null,
          priority: null,
          summary: `No evidence-backed benchmark found for ${dimension.name}.`
        } satisfies GapPriority;
      }

      const comparisonScores = knownScores
        .slice(1)
        .map((item) => item.scorecard.score)
        .filter((score): score is number => score !== null);
      const baselineScore = comparisonScores.length > 0
        ? round(average(comparisonScores) ?? benchmark.scorecard.score ?? 0)
        : benchmark.scorecard.score;
      const gapSize =
        benchmark.scorecard.score === null || baselineScore === null
          ? null
          : round(Math.max(0, benchmark.scorecard.score - baselineScore));
      const benchmarkCandidate = candidatesById.get(benchmark.candidateId);
      const priority =
        gapSize === null
          ? null
          : round(dimension.weight * gapSize * Math.max(benchmark.candidateCoverage, 0.25));

      return {
        dimensionId: dimension.id,
        status: "known",
        benchmarkCandidateId: benchmark.candidateId,
        benchmarkCandidateName: benchmarkCandidate?.name ?? benchmark.candidateId,
        benchmarkMatchedModes: benchmarkCandidate?.matchedModes ?? [],
        benchmarkEvidenceIds: benchmark.scorecard.evidenceIds,
        benchmarkScore: benchmark.scorecard.score,
        baselineScore,
        gapSize,
        priority,
        summary:
          gapSize === 0
            ? `${benchmarkCandidate?.name ?? benchmark.candidateId} is the only evidence-backed benchmark for ${dimension.name}.`
            : `${benchmarkCandidate?.name ?? benchmark.candidateId} leads ${dimension.name} by ${gapSize} points over the current cohort baseline.`
      } satisfies GapPriority;
    })
    .sort((left, right) => (right.priority ?? -1) - (left.priority ?? -1));

  return gaps.map((gap) => {
    if (gap.status === "unknown") {
      return gap;
    }

    const candidateScorecard = scorecardsByCandidate.get(gap.benchmarkCandidateId ?? "");

    if (!candidateScorecard) {
      return {
        ...gap,
        status: "unknown",
        priority: null,
        summary: `Benchmark scorecard for ${gap.dimensionId} could not be restored.`
      } satisfies GapPriority;
    }

    return gap;
  });
}
