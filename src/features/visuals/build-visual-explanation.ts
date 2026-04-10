import type {
  AnalysisRun,
  CandidateScorecard,
  Dimension,
  DimensionScorecard,
  Evidence,
  GapPriority
} from "@/features/analysis-run/types";
import type { VisualTarget } from "./relationship-graph-types";

export type VisualExplanationMetric = {
  label: string;
  value: string;
};

export type VisualExplanationEvidence = {
  id: string;
  sourceType: Evidence["sourceType"];
  url: string;
  excerpt: string;
  extractedValue: string;
  confidenceLabel: string;
};

export type VisualExplanation = {
  title: string;
  subtitle: string;
  summary: string;
  metrics: VisualExplanationMetric[];
  related: VisualExplanationMetric[];
  evidence: VisualExplanationEvidence[];
};

type BuildVisualExplanationInput = {
  run: AnalysisRun;
  target: VisualTarget | null;
};

function formatScore(value: number | null) {
  return value === null ? "Unknown" : value.toFixed(1);
}

function formatCoverage(value: number) {
  return `${Math.round(value * 100)}%`;
}

function buildEvidenceRecords(records: Evidence[]) {
  return records.map((record) => ({
    id: record.id,
    sourceType: record.sourceType,
    url: record.url,
    excerpt: record.excerpt,
    extractedValue: record.extractedValue,
    confidenceLabel: `${Math.round(record.confidence * 100)}%`
  }));
}

function getCandidateScorecard(run: AnalysisRun, candidateId: string) {
  return run.scoring?.candidateScorecards.find((scorecard) => scorecard.candidateId === candidateId) ?? null;
}

function getDimensionScorecard(scorecard: CandidateScorecard | null, dimensionId: string) {
  return (
    scorecard?.dimensionScorecards.find((item) => item.dimensionId === dimensionId) ?? null
  );
}

function getGap(run: AnalysisRun, dimensionId: string) {
  return run.scoring?.gaps.find((item) => item.dimensionId === dimensionId) ?? null;
}

function getEvidenceByIds(run: AnalysisRun, evidenceIds: string[]) {
  const evidenceById = new Map(run.evidence.map((record) => [record.id, record]));

  return evidenceIds
    .map((evidenceId) => evidenceById.get(evidenceId) ?? null)
    .filter((record): record is Evidence => record !== null);
}

function buildGoalExplanation(run: AnalysisRun): VisualExplanation {
  const enabledDimensions = run.dimensions.filter((dimension) => dimension.enabled);

  return {
    title: run.goal?.name ?? "Current goal",
    subtitle: "Goal overview",
    summary: run.goal?.jobToBeDone ?? "Use this surface to compare evidence-backed candidates.",
    metrics: [
      {
        label: "Stage",
        value: run.goal?.currentStage ?? "Unknown"
      },
      {
        label: "Enabled dimensions",
        value: String(enabledDimensions.length)
      },
      {
        label: "Scored candidates",
        value: String(run.scoring?.candidateScorecards.length ?? 0)
      }
    ],
    related: [
      {
        label: "Hard constraints",
        value: run.goal?.hardConstraints.join(", ") || "none"
      },
      {
        label: "Soft preferences",
        value: run.goal?.softPreferences.join(", ") || "none"
      }
    ],
    evidence: []
  };
}

function buildCandidateExplanation(
  run: AnalysisRun,
  candidateId: string
): VisualExplanation | null {
  const candidate = run.candidates.find((item) => item.id === candidateId);
  const scorecard = getCandidateScorecard(run, candidateId);

  if (!candidate || !scorecard) {
    return null;
  }

  const knownDimensions = scorecard.dimensionScorecards.filter(
    (item) => item.status === "known" && item.score !== null
  );
  const evidenceIds = scorecard.dimensionScorecards.flatMap((item) => item.evidenceIds);

  return {
    title: candidate.name,
    subtitle: "Candidate explanation",
    summary:
      scorecard.overallScore === null
        ? "This candidate has not reached an evidence-backed overall score yet."
        : `${candidate.name} is visible because scoring already exists for this analysis run.`,
    metrics: [
      {
        label: "Overall score",
        value: formatScore(scorecard.overallScore)
      },
      {
        label: "Coverage",
        value: formatCoverage(scorecard.coverage)
      },
      {
        label: "Unknown dimensions",
        value: String(scorecard.unknownCount)
      }
    ],
    related: [
      {
        label: "Matched modes",
        value: candidate.matchedModes.join(", ") || "none"
      },
      {
        label: "Known dimensions",
        value:
          knownDimensions
            .map((item) => {
              const dimension = run.dimensions.find((record) => record.id === item.dimensionId);

              return `${dimension?.name ?? item.dimensionId} ${formatScore(item.score)}`;
            })
            .join(", ") || "none"
      }
    ],
    evidence: buildEvidenceRecords(getEvidenceByIds(run, evidenceIds))
  };
}

function buildDimensionExplanation(
  run: AnalysisRun,
  dimension: Dimension,
  gap: GapPriority | null
): VisualExplanation {
  const scoredEntries = (run.scoring?.candidateScorecards ?? [])
    .map((scorecard) => ({
      candidate: run.candidates.find((candidate) => candidate.id === scorecard.candidateId) ?? null,
      scorecard: getDimensionScorecard(scorecard, dimension.id)
    }))
    .filter(
      (
        item
      ): item is {
        candidate: NonNullable<typeof item.candidate>;
        scorecard: DimensionScorecard;
      } =>
        item.candidate !== null &&
        item.scorecard !== null &&
        item.scorecard.status === "known" &&
        item.scorecard.score !== null
    )
    .sort((left, right) => (right.scorecard.score ?? 0) - (left.scorecard.score ?? 0));
  const evidenceIds = scoredEntries.flatMap((item) => item.scorecard.evidenceIds);

  return {
    title: dimension.name,
    subtitle: "Dimension explanation",
    summary: dimension.definition,
    metrics: [
      {
        label: "Weight",
        value: dimension.weight.toFixed(3)
      },
      {
        label: "Direction",
        value: dimension.direction
      },
      {
        label: "Known candidates",
        value: String(scoredEntries.length)
      }
    ],
    related: [
      {
        label: "Benchmark",
        value: gap?.benchmarkCandidateName ?? "Unknown"
      },
      {
        label: "Gap priority",
        value: gap?.priority === null || gap?.priority === undefined ? "Unknown" : gap.priority.toFixed(1)
      }
    ],
    evidence: buildEvidenceRecords(getEvidenceByIds(run, evidenceIds))
  };
}

function buildGapExplanation(
  run: AnalysisRun,
  gap: GapPriority
): VisualExplanation {
  return {
    title: `${run.dimensions.find((dimension) => dimension.id === gap.dimensionId)?.name ?? gap.dimensionId} gap`,
    subtitle: "Gap explanation",
    summary: gap.summary,
    metrics: [
      {
        label: "Priority",
        value: formatScore(gap.priority)
      },
      {
        label: "Benchmark score",
        value: formatScore(gap.benchmarkScore)
      },
      {
        label: "Baseline score",
        value: formatScore(gap.baselineScore)
      }
    ],
    related: [
      {
        label: "Benchmark candidate",
        value: gap.benchmarkCandidateName ?? "Unknown"
      },
      {
        label: "Matched modes",
        value: gap.benchmarkMatchedModes.join(", ") || "none"
      }
    ],
    evidence: buildEvidenceRecords(getEvidenceByIds(run, gap.benchmarkEvidenceIds))
  };
}

function buildEdgeExplanation(
  run: AnalysisRun,
  target: Extract<VisualTarget, { type: "edge" }>
): VisualExplanation | null {
  if (target.relation === "goal_to_dimension" && target.dimensionId) {
    const dimension = run.dimensions.find((item) => item.id === target.dimensionId);

    if (!dimension) {
      return null;
    }

    return {
      title: `${run.goal?.name ?? "Current goal"} -> ${dimension.name}`,
      subtitle: "Relationship explanation",
      summary: `${dimension.name} stays active because it is part of the current goal definition.`,
      metrics: [
        {
          label: "Weight",
          value: dimension.weight.toFixed(3)
        }
      ],
      related: [
        {
          label: "Direction",
          value: dimension.direction
        }
      ],
      evidence: []
    };
  }

  if (target.relation === "dimension_to_candidate" && target.dimensionId && target.candidateId) {
    const dimension = run.dimensions.find((item) => item.id === target.dimensionId);
    const scorecard = getDimensionScorecard(
      getCandidateScorecard(run, target.candidateId),
      target.dimensionId
    );

    if (!dimension || !scorecard) {
      return null;
    }

    return {
      title: `${dimension.name} -> ${run.candidates.find((item) => item.id === target.candidateId)?.name ?? target.candidateId}`,
      subtitle: "Relationship explanation",
      summary: scorecard.summary,
      metrics: [
        {
          label: "Dimension score",
          value: formatScore(scorecard.score)
        },
        {
          label: "Coverage",
          value: formatCoverage(scorecard.coverage)
        }
      ],
      related: [
        {
          label: "Evidence IDs",
          value: scorecard.evidenceIds.join(", ") || "none"
        }
      ],
      evidence: buildEvidenceRecords(getEvidenceByIds(run, scorecard.evidenceIds))
    };
  }

  if (target.relation === "dimension_to_gap" && target.dimensionId) {
    const gap = getGap(run, target.dimensionId);

    if (!gap) {
      return null;
    }

    return buildGapExplanation(run, gap);
  }

  return null;
}

export function buildVisualExplanation(
  input: BuildVisualExplanationInput
): VisualExplanation | null {
  if (!input.target) {
    return null;
  }

  const target = input.target;

  switch (target.type) {
    case "goal":
      return buildGoalExplanation(input.run);
    case "candidate":
      return buildCandidateExplanation(input.run, target.candidateId);
    case "dimension": {
      const dimension = input.run.dimensions.find(
        (item) => item.id === target.dimensionId
      );

      if (!dimension) {
        return null;
      }

      return buildDimensionExplanation(input.run, dimension, getGap(input.run, dimension.id));
    }
    case "gap": {
      const gap = getGap(input.run, target.dimensionId);

      return gap ? buildGapExplanation(input.run, gap) : null;
    }
    case "edge":
      return buildEdgeExplanation(input.run, target);
    default:
      return null;
  }
}
