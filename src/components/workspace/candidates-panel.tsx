"use client";

import { useState, useTransition } from "react";
import type { AnalysisRun, Candidate } from "@/features/analysis-run/types";
import { DEEP_DIVE_LIMIT } from "@/features/candidate-recall/select-top-candidates";

type CandidatesPanelProps = {
  run: AnalysisRun;
  onRunChanged: (run: AnalysisRun) => void;
};

function canShowCandidatePanel(status: AnalysisRun["status"]) {
  return (
    status === "search_plan_confirmed" ||
    status === "candidates_ready" ||
    status === "evidence_ready"
  );
}

function isDeepDiveCandidate(candidate: Candidate) {
  return candidate.recallRank <= DEEP_DIVE_LIMIT;
}

export function CandidatesPanel({ run, onRunChanged }: CandidatesPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generateCandidates(forceRegenerate = false) {
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/runs/${run.id}/candidates`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              forceRegenerate
            })
          });
          const payload = (await response.json()) as {
            error?: string;
            run?: AnalysisRun;
          };

          if (!response.ok || !payload.run) {
            setError(payload.error ?? "Failed to generate candidates.");
            return;
          }

          onRunChanged(payload.run);
        } catch (generationError) {
          setError(
            generationError instanceof Error
              ? generationError.message
              : "Failed to generate candidates."
          );
        }
      })();
    });
  }

  if (!canShowCandidatePanel(run.status)) {
    return (
      <p style={styles.waiting}>
        Candidates stay locked until the SearchPlan is confirmed as `search_plan_confirmed`.
      </p>
    );
  }

  if (run.candidates.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.waiting}>
          Generate candidate recall now that the SearchPlan is confirmed. This produces the
          ordered candidate list and marks the top-5 deep-dive set for evidence intake.
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => generateCandidates(false)}
          disabled={isPending}
          data-testid="generate-candidates"
        >
          {isPending ? "Generating..." : "Generate candidates"}
        </button>
        {error ? <p style={styles.error}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="candidates-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          Candidate recall is persisted on the run. Rows marked as `Deep-dive set` are the
          only ones Phase 3 will send into evidence intake.
        </p>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => generateCandidates(true)}
          disabled={isPending}
          data-testid="regenerate-candidates"
        >
          {isPending ? "Refreshing..." : "Regenerate candidates"}
        </button>
      </div>

      <div style={styles.grid}>
        {run.candidates.map((candidate) => (
          <article
            key={candidate.id}
            style={styles.card}
            data-testid="candidate-card"
          >
            <div style={styles.cardHeader}>
              <div>
                <strong>{candidate.recallRank}. {candidate.name}</strong>
                <p style={styles.meta}>
                  Modes: {candidate.matchedModes.join(", ")}
                </p>
              </div>
              {isDeepDiveCandidate(candidate) ? (
                <span style={styles.deepDiveBadge} data-testid="candidate-deep-dive-badge">
                  Deep-dive set
                </span>
              ) : null}
            </div>
            <p style={styles.body}>
              Strength dimensions:{" "}
              {candidate.strengthDimensions.length > 0
                ? candidate.strengthDimensions.join(", ")
                : "No explicit dimension signal yet"}
            </p>
            {candidate.officialUrl ? (
              <a
                href={candidate.officialUrl}
                target="_blank"
                rel="noreferrer"
                style={styles.link}
              >
                {candidate.officialUrl}
              </a>
            ) : (
              <p style={styles.meta}>No official URL captured yet.</p>
            )}
            <p style={styles.meta}>
              Queries: {candidate.matchedQueries.join(" | ")}
            </p>
          </article>
        ))}
      </div>

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
  grid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
  },
  card: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "8px",
    padding: "16px"
  },
  cardHeader: {
    alignItems: "start",
    display: "flex",
    gap: "12px",
    justifyContent: "space-between"
  },
  deepDiveBadge: {
    background: "var(--accent-soft)",
    borderRadius: "999px",
    color: "var(--accent)",
    fontSize: "12px",
    fontWeight: 700,
    padding: "6px 10px"
  },
  meta: {
    color: "var(--text-muted)",
    fontSize: "13px",
    margin: 0
  },
  body: {
    lineHeight: 1.6,
    margin: 0
  },
  link: {
    color: "var(--accent)",
    overflowWrap: "anywhere"
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
} satisfies Record<string, React.CSSProperties>;
