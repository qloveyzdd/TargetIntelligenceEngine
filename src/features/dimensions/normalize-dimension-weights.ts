import type { Dimension } from "@/features/analysis-run/types";

function roundWeight(value: number) {
  return Number(value.toFixed(3));
}

export function normalizeDimensionWeights(dimensions: Dimension[]) {
  const nextDimensions = dimensions.map((dimension) => ({
    ...dimension,
    evidenceNeeded: [...dimension.evidenceNeeded]
  }));
  const enabledDimensions = nextDimensions.filter((dimension) => dimension.enabled);

  if (enabledDimensions.length === 0) {
    return nextDimensions;
  }

  const totalWeight = enabledDimensions.reduce((sum, dimension) => sum + dimension.weight, 0);
  const baseWeight = totalWeight > 0 ? totalWeight : enabledDimensions.length;
  const equalWeight = totalWeight > 0 ? null : 1 / enabledDimensions.length;
  let lastEnabledIndex = -1;

  for (let index = 0; index < nextDimensions.length; index += 1) {
    const dimension = nextDimensions[index];

    if (!dimension.enabled) {
      continue;
    }

    lastEnabledIndex = index;
    nextDimensions[index] = {
      ...dimension,
      weight: roundWeight(
        equalWeight === null ? dimension.weight / baseWeight : equalWeight
      )
    };
  }

  if (lastEnabledIndex >= 0) {
    const enabledTotal = nextDimensions
      .filter((dimension) => dimension.enabled)
      .reduce((sum, dimension) => sum + dimension.weight, 0);

    nextDimensions[lastEnabledIndex] = {
      ...nextDimensions[lastEnabledIndex],
      weight: roundWeight(nextDimensions[lastEnabledIndex].weight + (1 - enabledTotal))
    };
  }

  return nextDimensions;
}
