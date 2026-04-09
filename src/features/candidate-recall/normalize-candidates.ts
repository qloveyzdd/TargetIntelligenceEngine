import type { Candidate, CandidateSource } from "@/features/analysis-run/types";

const sourcePriority: Record<CandidateSource["sourceType"], number> = {
  official_site: 0,
  docs: 1,
  pricing: 2,
  review: 3
};

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value: string) {
  return normalizeId(value);
}

function normalizeUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function toDomain(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function mergeSources(left: CandidateSource[], right: CandidateSource[]) {
  const seen = new Set<string>();
  const merged = [...left, ...right].filter((source) => {
    const key = `${source.sourceType}:${normalizeUrl(source.url) ?? source.url}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return merged.sort((a, b) => {
    const priority = sourcePriority[a.sourceType] - sourcePriority[b.sourceType];

    if (priority !== 0) {
      return priority;
    }

    return a.url.localeCompare(b.url);
  });
}

function mergeCandidate(current: Candidate | undefined, incoming: Candidate): Candidate {
  if (!current) {
    return {
      ...incoming,
      officialUrl:
        normalizeUrl(incoming.officialUrl) ??
        incoming.sources.find((source) => source.sourceType === "official_site")?.url ??
        null
    };
  }

  const officialUrl =
    normalizeUrl(current.officialUrl) ??
    normalizeUrl(incoming.officialUrl) ??
    current.sources.find((source) => source.sourceType === "official_site")?.url ??
    incoming.sources.find((source) => source.sourceType === "official_site")?.url ??
    null;

  return {
    ...current,
    id: normalizeId(toDomain(officialUrl) ?? current.name),
    name: current.name.length >= incoming.name.length ? current.name : incoming.name,
    officialUrl,
    matchedModes: Array.from(new Set([...current.matchedModes, ...incoming.matchedModes])),
    strengthDimensions: Array.from(
      new Set([...current.strengthDimensions, ...incoming.strengthDimensions])
    ),
    sources: mergeSources(current.sources, incoming.sources),
    matchedQueries: Array.from(new Set([...current.matchedQueries, ...incoming.matchedQueries])),
    recallRank: 0
  };
}

export function normalizeCandidates(candidates: Candidate[]) {
  const byKey = new Map<string, Candidate>();

  for (const candidate of candidates) {
    const officialUrl =
      normalizeUrl(candidate.officialUrl) ??
      candidate.sources.find((source) => source.sourceType === "official_site")?.url ??
      null;
    const key = toDomain(officialUrl) ?? normalizeName(candidate.name);
    const current = byKey.get(key);
    const merged = mergeCandidate(current, {
      ...candidate,
      officialUrl,
      id: normalizeId(toDomain(officialUrl) ?? candidate.name)
    });

    byKey.set(key, merged);
  }

  return Array.from(byKey.values());
}
