import type { CSSProperties } from "react";
import type { AnalysisRun } from "@/features/analysis-run/types";

type ScoringPanelProps = {
  run: AnalysisRun;
  isPending?: boolean;
  error?: string | null;
  onGenerate: (forceRegenerate?: boolean) => void;
};

function formatScore(value: number | null) {
  return value === null ? "未知" : value.toFixed(1);
}

function formatCoverage(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatScoreStatus(value: string) {
  return value === "known" ? "已知" : value === "unknown" ? "未知" : value;
}

export function ScoringPanel({
  run,
  isPending = false,
  error = null,
  onGenerate
}: ScoringPanelProps) {
  const candidateNames = new Map(run.candidates.map((candidate) => [candidate.id, candidate.name]));
  const dimensionNames = new Map(run.dimensions.map((dimension) => [dimension.id, dimension.name]));
  const evidenceById = new Map(run.evidence.map((record) => [record.id, record]));

  if (run.evidence.length === 0) {
    return (
      <p style={styles.waiting}>
        当前运行必须先有证据，才能开始评分。
      </p>
    );
  }

  if (!run.scoring) {
    return (
      <div style={styles.emptyState} data-testid="scoring-empty-state">
        <p style={styles.waiting}>
          生成评分后，证据会被转成维度评分卡、整体覆盖率和差距优先级。
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => onGenerate(false)}
          disabled={isPending}
          data-testid="generate-scoring"
        >
          {isPending ? "生成中..." : "生成评分"}
        </button>
        {error ? <p style={styles.error}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="scoring-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          评分坚持 evidence-first：每张评分卡和每条差距记录都会保留对应的证据 ID。
        </p>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => onGenerate(true)}
          disabled={isPending}
          data-testid="regenerate-scoring"
        >
          {isPending ? "刷新中..." : "重新生成评分"}
        </button>
      </div>

      <div style={styles.scorecards} data-testid="candidate-scorecards">
        {run.scoring.candidateScorecards.map((candidateScorecard) => (
          <section
            key={candidateScorecard.candidateId}
            style={styles.candidateCard}
            data-testid="candidate-scorecard"
          >
            <div style={styles.summaryRow}>
              <div>
                <h3 style={styles.cardTitle}>
                  {candidateNames.get(candidateScorecard.candidateId) ??
                    candidateScorecard.candidateId}
                </h3>
                <p style={styles.meta}>
                  总分：
                  {" "}
                  <strong data-testid="overall-score">
                    {formatScore(candidateScorecard.overallScore)}
                  </strong>
                </p>
              </div>
              <div style={styles.badgeRow}>
                <span style={styles.badge} data-testid="coverage-value">
                  覆盖率 {formatCoverage(candidateScorecard.coverage)}
                </span>
                <span style={styles.badge} data-testid="unknown-count-value">
                  未知维度 {candidateScorecard.unknownCount}
                </span>
              </div>
            </div>

            <div style={styles.detailsList}>
              {candidateScorecard.dimensionScorecards.map((dimensionScorecard) => (
                <details
                  key={`${candidateScorecard.candidateId}:${dimensionScorecard.dimensionId}`}
                  style={styles.details}
                  data-testid="dimension-scorecard-details"
                >
                  <summary style={styles.summary} data-testid="dimension-scorecard-toggle">
                    <span>
                      {dimensionNames.get(dimensionScorecard.dimensionId) ??
                        dimensionScorecard.dimensionId}
                    </span>
                    <span>
                      {formatScore(dimensionScorecard.score)} | {formatScoreStatus(dimensionScorecard.status)}
                    </span>
                  </summary>
                  <div style={styles.detailsBody}>
                    <p style={styles.meta}>{dimensionScorecard.summary}</p>
                    <p style={styles.meta}>
                      证据 ID：
                      {" "}
                      {dimensionScorecard.evidenceIds.length > 0
                        ? dimensionScorecard.evidenceIds.join(", ")
                        : "无"}
                    </p>
                    <ul style={styles.contributionList}>
                      {dimensionScorecard.contributions.map((contribution) => {
                        const evidence = evidenceById.get(contribution.evidenceId);

                        return (
                          <li
                            key={contribution.evidenceId}
                            style={styles.contributionItem}
                            data-testid="score-contribution"
                          >
                            <p style={styles.meta}>
                              {contribution.evidenceId} | {formatScoreStatus(contribution.status)} | 权重{" "}
                              {contribution.contributionWeight.toFixed(3)}
                            </p>
                            <p style={styles.body}>{contribution.summary}</p>
                            {evidence ? (
                              <p style={styles.meta}>
                                {evidence.sourceType} | {evidence.extractedValue}
                              </p>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section style={styles.gapCard}>
        <div style={styles.summaryRow}>
          <div>
            <h3 style={styles.cardTitle}>差距优先级</h3>
            <p style={styles.meta}>
              按加权差距大小排序的基准维度。
            </p>
          </div>
          <span style={styles.badge} data-testid="gap-count">
            {run.scoring.gaps.length} 条差距
          </span>
        </div>
        <div style={styles.detailsList}>
          {run.scoring.gaps.map((gap) => (
            <details
              key={gap.dimensionId}
              style={styles.details}
              data-testid="gap-details"
            >
              <summary style={styles.summary} data-testid="gap-toggle">
                <span>{dimensionNames.get(gap.dimensionId) ?? gap.dimensionId}</span>
                <span>
                  {gap.status === "unknown" ? "未知" : `${gap.priority?.toFixed(1) ?? "0.0"} 优先级`}
                </span>
              </summary>
              <div style={styles.detailsBody}>
                <p style={styles.meta}>{gap.summary}</p>
                <p style={styles.meta}>
                  基准候选：{gap.benchmarkCandidateName ?? "未知"} | 匹配模式：
                  {" "}
                  {gap.benchmarkMatchedModes.join(", ") || "无"}
                </p>
                <p style={styles.meta}>
                  基准证据 ID：
                  {" "}
                  {gap.benchmarkEvidenceIds.length > 0
                    ? gap.benchmarkEvidenceIds.join(", ")
                    : "无"}
                </p>
                <p style={styles.meta}>
                  基准分：{formatScore(gap.benchmarkScore)} | 当前分：
                  {" "}
                  {formatScore(gap.baselineScore)} | 差距：
                  {" "}
                  {formatScore(gap.gapSize)}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {error ? <p style={styles.error}>{error}</p> : null}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "16px"
  },
  toolbar: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "space-between"
  },
  waiting: {
    color: "var(--text-muted)",
    margin: 0
  },
  emptyState: {
    display: "grid",
    gap: "12px"
  },
  scorecards: {
    display: "grid",
    gap: "16px"
  },
  candidateCard: {
    background: "rgba(255,255,255,0.56)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "14px",
    padding: "16px"
  },
  gapCard: {
    background: "rgba(255,255,255,0.56)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "14px",
    padding: "16px"
  },
  summaryRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "space-between"
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },
  badge: {
    background: "var(--accent-soft)",
    borderRadius: "999px",
    color: "var(--accent)",
    fontSize: "12px",
    fontWeight: 600,
    padding: "8px 12px"
  },
  cardTitle: {
    margin: 0
  },
  meta: {
    color: "var(--text-muted)",
    fontSize: "13px",
    lineHeight: 1.6,
    margin: 0
  },
  body: {
    lineHeight: 1.6,
    margin: 0
  },
  detailsList: {
    display: "grid",
    gap: "10px"
  },
  details: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    padding: "10px 12px"
  },
  summary: {
    cursor: "pointer",
    display: "flex",
    fontWeight: 600,
    justifyContent: "space-between"
  },
  detailsBody: {
    display: "grid",
    gap: "8px",
    marginTop: "10px"
  },
  contributionList: {
    display: "grid",
    gap: "8px",
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  contributionItem: {
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    display: "grid",
    gap: "4px",
    padding: "10px"
  },
  primaryButton: {
    background: "var(--accent)",
    border: 0,
    borderRadius: "999px",
    color: "#fff",
    cursor: "pointer",
    padding: "12px 18px"
  },
  secondaryButton: {
    background: "rgba(255,255,255,0.8)",
    border: "1px solid var(--card-border)",
    borderRadius: "999px",
    cursor: "pointer",
    padding: "12px 18px"
  },
  error: {
    color: "#b12424",
    margin: 0
  }
} satisfies Record<string, CSSProperties>;
