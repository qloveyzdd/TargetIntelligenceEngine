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
  return value === null ? "未知" : value.toFixed(1);
}

function formatCoverage(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatStageLabel(value: string | undefined) {
  switch (value) {
    case "idea":
      return "想法";
    case "validation":
      return "验证";
    case "mvp":
      return "MVP";
    case "growth":
      return "增长";
    default:
      return value ?? "未知";
  }
}

function formatDirectionLabel(value: Dimension["direction"]) {
  return value === "higher_better" ? "越高越好" : "越低越好";
}

function formatMatchedModes(values: string[]) {
  if (values.length === 0) {
    return "无";
  }

  return values
    .map((value) => {
      if (value === "same_goal") {
        return "同目标";
      }

      if (value === "dimension_leader") {
        return "维度冠军";
      }

      return value;
    })
    .join(", ");
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
    title: run.goal?.name ?? "当前目标",
    subtitle: "目标概览",
    summary: run.goal?.jobToBeDone ?? "在这里对比有证据支撑的候选对象。",
    metrics: [
      {
        label: "阶段",
        value: formatStageLabel(run.goal?.currentStage)
      },
      {
        label: "启用维度",
        value: String(enabledDimensions.length)
      },
      {
        label: "已评分候选",
        value: String(run.scoring?.candidateScorecards.length ?? 0)
      }
    ],
    related: [
      {
        label: "硬约束",
        value: run.goal?.hardConstraints.join(", ") || "无"
      },
      {
        label: "软偏好",
        value: run.goal?.softPreferences.join(", ") || "无"
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
    subtitle: "候选说明",
    summary:
      scorecard.overallScore === null
        ? "这个候选还没有形成有证据支撑的总分。"
        : `${candidate.name} 当前会显示在这里，是因为这次分析已经生成了评分结果。`,
    metrics: [
      {
        label: "总分",
        value: formatScore(scorecard.overallScore)
      },
      {
        label: "覆盖率",
        value: formatCoverage(scorecard.coverage)
      },
      {
        label: "未知维度",
        value: String(scorecard.unknownCount)
      }
    ],
    related: [
      {
        label: "匹配模式",
        value: formatMatchedModes(candidate.matchedModes)
      },
      {
        label: "已知维度",
        value:
          knownDimensions
            .map((item) => {
              const dimension = run.dimensions.find((record) => record.id === item.dimensionId);

              return `${dimension?.name ?? item.dimensionId} ${formatScore(item.score)}`;
            })
            .join(", ") || "无"
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
    subtitle: "维度说明",
    summary: dimension.definition,
    metrics: [
      {
        label: "权重",
        value: dimension.weight.toFixed(3)
      },
      {
        label: "方向",
        value: formatDirectionLabel(dimension.direction)
      },
      {
        label: "已知候选",
        value: String(scoredEntries.length)
      }
    ],
    related: [
      {
        label: "基准候选",
        value: gap?.benchmarkCandidateName ?? "未知"
      },
      {
        label: "差距优先级",
        value: gap?.priority === null || gap?.priority === undefined ? "未知" : gap.priority.toFixed(1)
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
    title: `${run.dimensions.find((dimension) => dimension.id === gap.dimensionId)?.name ?? gap.dimensionId} 差距`,
    subtitle: "差距说明",
    summary: gap.summary,
    metrics: [
      {
        label: "优先级",
        value: formatScore(gap.priority)
      },
      {
        label: "基准分",
        value: formatScore(gap.benchmarkScore)
      },
      {
        label: "当前分",
        value: formatScore(gap.baselineScore)
      }
    ],
    related: [
      {
        label: "基准候选",
        value: gap.benchmarkCandidateName ?? "未知"
      },
      {
        label: "匹配模式",
        value: formatMatchedModes(gap.benchmarkMatchedModes)
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
      title: `${run.goal?.name ?? "当前目标"} -> ${dimension.name}`,
      subtitle: "关系说明",
      summary: `${dimension.name} 保持启用，是因为它属于当前目标定义的一部分。`,
      metrics: [
        {
          label: "权重",
          value: dimension.weight.toFixed(3)
        }
      ],
      related: [
        {
          label: "方向",
          value: formatDirectionLabel(dimension.direction)
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
      subtitle: "关系说明",
      summary: scorecard.summary,
      metrics: [
        {
          label: "维度得分",
          value: formatScore(scorecard.score)
        },
        {
          label: "覆盖率",
          value: formatCoverage(scorecard.coverage)
        }
      ],
      related: [
        {
          label: "证据 ID",
          value: scorecard.evidenceIds.join(", ") || "无"
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
