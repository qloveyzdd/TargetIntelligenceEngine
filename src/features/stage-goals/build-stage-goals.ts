import type {
  AnalysisRunScoring,
  Candidate,
  Dimension,
  GoalCard,
  GapPriority,
  StageGoal,
  StageGoalStage
} from "@/features/analysis-run/types";

type BuildStageGoalsInput = {
  goal: GoalCard | null;
  dimensions: Dimension[];
  candidates: Candidate[];
  scoring: AnalysisRunScoring;
};

type StageBucket = {
  stage: StageGoalStage;
  label: string;
  gaps: GapPriority[];
};

const stageOrder: Array<{ stage: StageGoalStage; label: string }> = [
  { stage: "validation", label: "Validation" },
  { stage: "mvp", label: "MVP" },
  { stage: "differentiation", label: "Differentiation" }
];

function unique(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function takeDimensionIds(dimensions: Dimension[], count: number) {
  return dimensions
    .filter((dimension) => dimension.enabled)
    .slice()
    .sort((left, right) => right.weight - left.weight)
    .slice(0, count)
    .map((dimension) => dimension.id);
}

function buildStageBuckets(gaps: GapPriority[]): StageBucket[] {
  const knownGaps = gaps.filter(
    (gap) => gap.status === "known" && gap.priority !== null
  );
  const firstBucket = knownGaps.slice(0, 1);
  const secondBucket = knownGaps.slice(1, Math.min(3, knownGaps.length));
  const thirdBucket = knownGaps.slice(Math.min(3, knownGaps.length));
  const rawBuckets = [firstBucket, secondBucket, thirdBucket];

  return stageOrder.map(({ stage, label }, index) => {
    const bucket = rawBuckets[index];

    if (bucket.length > 0) {
      return {
        stage,
        label,
        gaps: bucket
      };
    }

    const fallbackGap = knownGaps[Math.min(index, Math.max(knownGaps.length - 1, 0))];

    return {
      stage,
      label,
      gaps: fallbackGap ? [fallbackGap] : []
    };
  });
}

function buildObjective(
  stageLabel: string,
  goalName: string,
  dimensionNames: string[]
) {
  const focus = dimensionNames.length > 0 ? dimensionNames.join(", ") : "the current analysis gaps";

  if (stageLabel === "Validation") {
    return `Validate the minimum evidence-backed threshold for ${goalName} across ${focus}.`;
  }

  if (stageLabel === "MVP") {
    return `Close the core product gap for ${goalName} across ${focus}.`;
  }

  return `Turn the strongest remaining gaps for ${goalName} into a differentiated edge across ${focus}.`;
}

function buildSuccessMetrics(
  stageLabel: string,
  dimensionNames: string[],
  referenceProducts: string[]
) {
  const focus = dimensionNames.length > 0 ? dimensionNames.join(", ") : "coverage";
  const benchmark = referenceProducts.length > 0 ? referenceProducts.join(", ") : "current benchmarks";

  if (stageLabel === "Validation") {
    return [
      `${focus} are no longer blocked by unknown evidence coverage.`,
      `The team can explain the baseline threshold against ${benchmark}.`
    ];
  }

  if (stageLabel === "MVP") {
    return [
      `${focus} move measurably closer to ${benchmark}.`,
      `The MVP preserves evidence coverage while improving the main gap.`
    ];
  }

  return [
    `${focus} create a visible edge relative to ${benchmark}.`,
    `Differentiation work does not regress the validated MVP baseline.`
  ];
}

function buildDeliverables(stageLabel: string, dimensionNames: string[]) {
  const focus = dimensionNames.length > 0 ? dimensionNames.join(", ") : "gap coverage";

  if (stageLabel === "Validation") {
    return [
      `Threshold notes for ${focus}.`,
      `Evidence-backed validation checklist.`
    ];
  }

  if (stageLabel === "MVP") {
    return [
      `Core improvements for ${focus}.`,
      `Updated benchmark comparisons for the MVP scope.`
    ];
  }

  return [
    `Differentiation package for ${focus}.`,
    `Positioning notes tied to the evidence-backed benchmark.`
  ];
}

function buildRisks(stageLabel: string, dimensionNames: string[]) {
  const focus = dimensionNames.length > 0 ? dimensionNames.join(", ") : "too many dimensions";

  if (stageLabel === "Validation") {
    return [`Treating weak evidence on ${focus} as if it were a low score.`];
  }

  if (stageLabel === "MVP") {
    return [`Trying to close ${focus} without keeping the scope small enough for an MVP.`];
  }

  return [`Chasing differentiation on ${focus} before the validated core remains stable.`];
}

export function buildStageGoals(input: BuildStageGoalsInput): StageGoal[] {
  const dimensionsById = new Map(input.dimensions.map((dimension) => [dimension.id, dimension]));
  const candidatesById = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
  const topDimensionFallback = takeDimensionIds(input.dimensions, 3);
  const goalName = input.goal?.name?.trim() || "the current goal";

  return buildStageBuckets(input.scoring.gaps).map((bucket, index) => {
    const basedOnGaps = unique(bucket.gaps.map((gap) => gap.dimensionId));
    const relatedDimensions =
      basedOnGaps.length > 0 ? basedOnGaps : topDimensionFallback.slice(index, index + 1);
    const dimensionNames = relatedDimensions.map(
      (dimensionId) => dimensionsById.get(dimensionId)?.name ?? dimensionId
    );
    const referenceProducts = unique(
      bucket.gaps.map((gap) => {
        if (gap.benchmarkCandidateName) {
          return gap.benchmarkCandidateName;
        }

        if (gap.benchmarkCandidateId) {
          return candidatesById.get(gap.benchmarkCandidateId)?.name ?? gap.benchmarkCandidateId;
        }

        return "";
      })
    );

    return {
      stage: bucket.stage,
      objective: buildObjective(bucket.label, goalName, dimensionNames),
      basedOnGaps,
      relatedDimensions,
      referenceProducts,
      successMetrics: buildSuccessMetrics(bucket.label, dimensionNames, referenceProducts),
      deliverables: buildDeliverables(bucket.label, dimensionNames),
      risks: buildRisks(bucket.label, dimensionNames)
    } satisfies StageGoal;
  });
}
