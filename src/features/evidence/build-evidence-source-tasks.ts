import type { Candidate, Dimension, SourceType } from "@/features/analysis-run/types";
import { DEEP_DIVE_LIMIT } from "@/features/candidate-recall/select-top-candidates";

export type EvidenceSourceTask = {
  candidateId: string;
  candidateName: string;
  dimensionId: string;
  sourceType: SourceType;
  url: string;
};

const sourcePriority: Record<SourceType, number> = {
  official_site: 0,
  docs: 1,
  pricing: 2,
  review: 3
};

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function buildEvidenceSourceTasks(input: {
  candidates: Candidate[];
  dimensions: Dimension[];
}) {
  const topCandidates = [...input.candidates]
    .sort((left, right) => left.recallRank - right.recallRank)
    .slice(0, DEEP_DIVE_LIMIT);
  const enabledDimensions = input.dimensions.filter((dimension) => dimension.enabled);
  const tasks: EvidenceSourceTask[] = [];
  const seen = new Set<string>();

  for (const candidate of topCandidates) {
    const sources = [
      ...(candidate.officialUrl
        ? [{ sourceType: "official_site" as const, url: candidate.officialUrl }]
        : []),
      ...candidate.sources
    ].sort((left, right) => {
      const priority = sourcePriority[left.sourceType] - sourcePriority[right.sourceType];

      if (priority !== 0) {
        return priority;
      }

      return left.url.localeCompare(right.url);
    });

    for (const dimension of enabledDimensions) {
      for (const source of sources) {
        const normalizedUrl = normalizeUrl(source.url);
        const key = `${candidate.id}:${dimension.id}:${normalizedUrl}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        tasks.push({
          candidateId: candidate.id,
          candidateName: candidate.name,
          dimensionId: dimension.id,
          sourceType: source.sourceType,
          url: normalizedUrl
        });
      }
    }
  }

  return tasks;
}
