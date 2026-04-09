import type {
  AnalysisRunScoring,
  Candidate,
  CandidateScorecard,
  Dimension,
  DimensionScorecard,
  Evidence,
  ScoringContribution
} from "@/features/analysis-run/types";
import { assessEvidence, getSourceWeight } from "./evidence-assessment";

type BuildScoringSnapshotInput = {
  candidates: Candidate[];
  dimensions: Dimension[];
  evidence: Evidence[];
};

type AssessedEvidence = Awaited<ReturnType<typeof assessEvidence>> & {
  candidateId: string;
  dimensionId: string;
  sourceType: Evidence["sourceType"];
  confidence: number;
  sourceWeight: number;
  contributionWeight: number;
};

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits));
}

function buildDimensionSummary(
  dimension: Dimension,
  contributions: ScoringContribution[],
  score: number | null
) {
  if (score === null) {
    return `No evidence-backed score for ${dimension.name} yet.`;
  }

  return `${dimension.name} scored from ${contributions.length} evidence record(s).`;
}

export async function buildScoringSnapshot(
  input: BuildScoringSnapshotInput
): Promise<AnalysisRunScoring> {
  const enabledDimensions = input.dimensions.filter((dimension) => dimension.enabled);
  const assessments = await Promise.all(
    input.evidence.map(async (evidence) => {
      const dimension = enabledDimensions.find((item) => item.id === evidence.dimensionId);

      if (!dimension) {
        return null;
      }

      const assessment = await assessEvidence({
        evidence,
        dimension
      });
      const sourceWeight = getSourceWeight(evidence.sourceType);

      return {
        ...assessment,
        candidateId: evidence.candidateId,
        dimensionId: evidence.dimensionId,
        sourceType: evidence.sourceType,
        confidence: evidence.confidence,
        sourceWeight,
        contributionWeight: round(sourceWeight * evidence.confidence)
      } satisfies AssessedEvidence;
    })
  );

  const validAssessments = assessments.filter((item): item is AssessedEvidence => item !== null);
  const candidateScorecards: CandidateScorecard[] = input.candidates
    .slice()
    .sort((left, right) => left.recallRank - right.recallRank)
    .map((candidate) => {
      const dimensionScorecards: DimensionScorecard[] = enabledDimensions.map((dimension) => {
        const dimensionAssessments = validAssessments.filter(
          (assessment) =>
            assessment.candidateId === candidate.id && assessment.dimensionId === dimension.id
        );

        const evidenceIds = dimensionAssessments.map((assessment) => assessment.evidenceId);
        const contributions: ScoringContribution[] = dimensionAssessments.map((assessment) => ({
          evidenceId: assessment.evidenceId,
          sourceType: assessment.sourceType,
          confidence: assessment.confidence,
          sourceWeight: assessment.sourceWeight,
          contributionWeight: assessment.contributionWeight,
          evidenceScore: assessment.evidenceScore,
          status: assessment.status,
          summary: assessment.summary
        }));
        const weightedContributions = dimensionAssessments.filter(
          (assessment) =>
            assessment.evidenceScore !== null && assessment.status !== "insufficient"
        );

        if (weightedContributions.length === 0) {
          return {
            candidateId: candidate.id,
            dimensionId: dimension.id,
            status: "unknown",
            score: null,
            coverage: 0,
            evidenceIds,
            contributions,
            summary: buildDimensionSummary(dimension, contributions, null)
          } satisfies DimensionScorecard;
        }

        const weightSum = weightedContributions.reduce(
          (sum, assessment) => sum + assessment.contributionWeight,
          0
        );
        const weightedScore =
          weightedContributions.reduce(
            (sum, assessment) =>
              sum + (assessment.evidenceScore ?? 0) * assessment.contributionWeight,
            0
          ) / weightSum;

        return {
          candidateId: candidate.id,
          dimensionId: dimension.id,
          status: "known",
          score: round(weightedScore * 100, 1),
          coverage: 1,
          evidenceIds,
          contributions,
          summary: buildDimensionSummary(dimension, contributions, weightedScore)
        } satisfies DimensionScorecard;
      });

      const knownDimensions = dimensionScorecards.filter(
        (scorecard) => scorecard.status === "known" && scorecard.score !== null
      );
      const knownWeightSum = enabledDimensions
        .filter((dimension) =>
          knownDimensions.some((scorecard) => scorecard.dimensionId === dimension.id)
        )
        .reduce((sum, dimension) => sum + dimension.weight, 0);
      const overallScore =
        knownWeightSum > 0
          ? round(
              knownDimensions.reduce((sum, scorecard) => {
                const dimension = enabledDimensions.find(
                  (item) => item.id === scorecard.dimensionId
                );

                return sum + (scorecard.score ?? 0) * (dimension?.weight ?? 0);
              }, 0) / knownWeightSum,
              1
            )
          : null;

      return {
        candidateId: candidate.id,
        overallScore,
        coverage:
          enabledDimensions.length > 0
            ? round(knownDimensions.length / enabledDimensions.length)
            : 0,
        unknownCount: enabledDimensions.length - knownDimensions.length,
        dimensionScorecards
      } satisfies CandidateScorecard;
    });

  return {
    generatedAt: new Date().toISOString(),
    candidateScorecards,
    gaps: []
  };
}
