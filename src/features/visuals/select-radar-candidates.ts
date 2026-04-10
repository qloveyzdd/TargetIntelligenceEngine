import type {
  AnalysisRunScoring,
  Candidate
} from "@/features/analysis-run/types";
import type { RadarCandidateSelection } from "./radar-types";

type SelectRadarCandidatesInput = {
  candidates: Candidate[];
  scoring: AnalysisRunScoring | null;
  selectedCandidateIds?: string[];
};

function buildScoredCandidateOrder(input: SelectRadarCandidatesInput) {
  if (!input.scoring) {
    return [];
  }

  const scorecardsByCandidateId = new Map(
    input.scoring.candidateScorecards.map((scorecard) => [scorecard.candidateId, scorecard])
  );

  return input.candidates
    .filter((candidate) => {
      const scorecard = scorecardsByCandidateId.get(candidate.id);

      return scorecard?.overallScore !== null;
    })
    .slice()
    .sort((left, right) => {
      const leftScore = scorecardsByCandidateId.get(left.id)?.overallScore ?? -1;
      const rightScore = scorecardsByCandidateId.get(right.id)?.overallScore ?? -1;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      if (left.recallRank !== right.recallRank) {
        return left.recallRank - right.recallRank;
      }

      return left.name.localeCompare(right.name);
    });
}

export function selectRadarCandidates(
  input: SelectRadarCandidatesInput
): RadarCandidateSelection {
  const scoredCandidates = buildScoredCandidateOrder(input);
  const availableCandidateIds = scoredCandidates.map((candidate) => candidate.id);
  const defaultCandidateIds = availableCandidateIds.slice(0, 3);

  if (!input.selectedCandidateIds) {
    return {
      availableCandidateIds,
      defaultCandidateIds,
      selectedCandidateIds: defaultCandidateIds
    };
  }

  const requested = new Set(input.selectedCandidateIds);
  const selectedCandidateIds = availableCandidateIds.filter((candidateId) =>
    requested.has(candidateId)
  );

  return {
    availableCandidateIds,
    defaultCandidateIds,
    selectedCandidateIds
  };
}
