import type { Dimension } from "@/features/analysis-run/types";

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildDimensionKey(dimension: Dimension) {
  return normalizeKey(dimension.id || dimension.name);
}

function mergeEvidence(left: string[], right: string[]) {
  return Array.from(new Set([...left, ...right]));
}

export function mergeDimensions(
  coreDimensions: Dimension[],
  dynamicDimensions: Dimension[]
): Dimension[] {
  const dimensionMap = new Map<string, Dimension>();

  for (const dimension of coreDimensions) {
    const key = buildDimensionKey(dimension);
    dimensionMap.set(key, {
      ...dimension,
      evidenceNeeded: [...dimension.evidenceNeeded]
    });
  }

  for (const dimension of dynamicDimensions) {
    if (dimension.layer === "core") {
      continue;
    }

    const key = buildDimensionKey(dimension);
    const existing = dimensionMap.get(key);

    if (!existing) {
      dimensionMap.set(key, {
        ...dimension,
        evidenceNeeded: [...dimension.evidenceNeeded]
      });
      continue;
    }

    if (existing.layer === "core") {
      continue;
    }

    dimensionMap.set(key, {
      ...existing,
      name: existing.name.length >= dimension.name.length ? existing.name : dimension.name,
      weight: Math.max(existing.weight, dimension.weight),
      direction: existing.direction,
      definition:
        existing.definition.length >= dimension.definition.length
          ? existing.definition
          : dimension.definition,
      evidenceNeeded: mergeEvidence(existing.evidenceNeeded, dimension.evidenceNeeded),
      layer:
        existing.layer === "project" || dimension.layer === "project"
          ? "project"
          : "domain",
      enabled: existing.enabled || dimension.enabled
    });
  }

  return Array.from(dimensionMap.values()).sort((left, right) => {
    const layerRank = {
      core: 0,
      domain: 1,
      project: 2
    };

    const rankGap = layerRank[left.layer] - layerRank[right.layer];

    if (rankGap !== 0) {
      return rankGap;
    }

    return left.name.localeCompare(right.name);
  });
}
