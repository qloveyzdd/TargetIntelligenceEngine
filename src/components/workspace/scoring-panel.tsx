import type { CSSProperties } from "react";
import type { AnalysisRun } from "@/features/analysis-run/types";

type ScoringPanelProps = {
  run: AnalysisRun;
  isPending?: boolean;
  error?: string | null;
  onGenerate: (forceRegenerate?: boolean) => void;
};

function formatScore(value: number | null) {
  return value === null ? "Unknown" : value.toFixed(1);
}

function formatCoverage(value: number) {
  return `${Math.round(value * 100)}%`;
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
        Scoring stays locked until evidence exists for the current analysis run.
      </p>
    );
  }

  if (!run.scoring) {
    return (
      <div style={styles.emptyState} data-testid="scoring-empty-state">
        <p style={styles.waiting}>
          Generate scoring to turn evidence into dimension scorecards, overall coverage, and
          gap priorities.
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => onGenerate(false)}
          disabled={isPending}
          data-testid="generate-scoring"
        >
          {isPending ? "Generating..." : "Generate scoring"}
        </button>
        {error ? <p style={styles.error}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="scoring-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          Scores stay evidence-first: every scorecard and gap row keeps the evidence IDs that
          explain it.
        </p>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => onGenerate(true)}
          disabled={isPending}
          data-testid="regenerate-scoring"
        >
          {isPending ? "Refreshing..." : "Regenerate scoring"}
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
                  Overall score:{" "}
                  <strong data-testid="overall-score">
                    {formatScore(candidateScorecard.overallScore)}
                  </strong>
                </p>
              </div>
              <div style={styles.badgeRow}>
                <span style={styles.badge} data-testid="coverage-value">
                  Coverage {formatCoverage(candidateScorecard.coverage)}
                </span>
                <span style={styles.badge} data-testid="unknown-count-value">
                  Unknown {candidateScorecard.unknownCount}
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
                      {formatScore(dimensionScorecard.score)} | {dimensionScorecard.status}
                    </span>
                  </summary>
                  <div style={styles.detailsBody}>
                    <p style={styles.meta}>{dimensionScorecard.summary}</p>
                    <p style={styles.meta}>
                      Evidence IDs:{" "}
                      {dimensionScorecard.evidenceIds.length > 0
                        ? dimensionScorecard.evidenceIds.join(", ")
                        : "none"}
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
                              {contribution.evidenceId} | {contribution.status} | weight{" "}
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
            <h3 style={styles.cardTitle}>Gap priorities</h3>
            <p style={styles.meta}>
              Benchmark-backed dimensions ranked by weighted gap size.
            </p>
          </div>
          <span style={styles.badge} data-testid="gap-count">
            {run.scoring.gaps.length} gaps
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
                  {gap.status === "unknown"
                    ? "Unknown"
                    : `${gap.priority?.toFixed(1) ?? "0.0"} priority`}
                </span>
              </summary>
              <div style={styles.detailsBody}>
                <p style={styles.meta}>{gap.summary}</p>
                <p style={styles.meta}>
                  Benchmark: {gap.benchmarkCandidateName ?? "Unknown"} | matched modes:{" "}
                  {gap.benchmarkMatchedModes.join(", ") || "none"}
                </p>
                <p style={styles.meta}>
                  Benchmark evidence IDs:{" "}
                  {gap.benchmarkEvidenceIds.length > 0
                    ? gap.benchmarkEvidenceIds.join(", ")
                    : "none"}
                </p>
                <p style={styles.meta}>
                  Benchmark score: {formatScore(gap.benchmarkScore)} | Baseline:{" "}
                  {formatScore(gap.baselineScore)} | Gap size: {formatScore(gap.gapSize)}
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
