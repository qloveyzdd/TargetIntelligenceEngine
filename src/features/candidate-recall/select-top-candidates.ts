import type { Candidate } from "@/features/analysis-run/types";

export const DEEP_DIVE_LIMIT = 5;

function countOfficialSources(candidate: Candidate) {
  return candidate.sources.filter((source) => source.sourceType !== "review").length;
}

function compareCandidates(left: Candidate, right: Candidate) {
  const sameGoalDiff =
    Number(right.matchedModes.includes("same_goal")) -
    Number(left.matchedModes.includes("same_goal"));

  if (sameGoalDiff !== 0) {
    return sameGoalDiff;
  }

  const officialUrlDiff = Number(Boolean(right.officialUrl)) - Number(Boolean(left.officialUrl));

  if (officialUrlDiff !== 0) {
    return officialUrlDiff;
  }

  const officialSourceDiff = countOfficialSources(right) - countOfficialSources(left);

  if (officialSourceDiff !== 0) {
    return officialSourceDiff;
  }

  const dimensionCoverageDiff = right.strengthDimensions.length - left.strengthDimensions.length;

  if (dimensionCoverageDiff !== 0) {
    return dimensionCoverageDiff;
  }

  const matchedQueriesDiff = right.matchedQueries.length - left.matchedQueries.length;

  if (matchedQueriesDiff !== 0) {
    return matchedQueriesDiff;
  }

  return left.name.localeCompare(right.name);
}

export function selectTopCandidates(candidates: Candidate[]) {
  return [...candidates]
    .sort(compareCandidates)
    .map((candidate, index) => ({
      ...candidate,
      recallRank: index + 1
    }));
}
