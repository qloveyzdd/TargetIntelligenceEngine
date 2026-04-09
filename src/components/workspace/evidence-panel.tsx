"use client";

import { useState, useTransition } from "react";
import type { AnalysisRun, Evidence } from "@/features/analysis-run/types";

type EvidencePanelProps = {
  run: AnalysisRun;
  onRunChanged: (run: AnalysisRun) => void;
};

function canShowEvidencePanel(status: AnalysisRun["status"]) {
  return status === "candidates_ready" || status === "evidence_ready";
}

function groupEvidence(evidence: Evidence[]) {
  const byCandidate = new Map<string, Map<string, Evidence[]>>();

  for (const item of evidence) {
    const candidateGroup = byCandidate.get(item.candidateId) ?? new Map<string, Evidence[]>();
    const dimensionGroup = candidateGroup.get(item.dimensionId) ?? [];

    dimensionGroup.push(item);
    candidateGroup.set(item.dimensionId, dimensionGroup);
    byCandidate.set(item.candidateId, candidateGroup);
  }

  return byCandidate;
}

export function EvidencePanel({ run, onRunChanged }: EvidencePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const groupedEvidence = groupEvidence(run.evidence);
  const candidateNames = new Map(run.candidates.map((candidate) => [candidate.id, candidate.name]));
  const dimensionNames = new Map(run.dimensions.map((dimension) => [dimension.id, dimension.name]));

  function generateEvidence(forceRegenerate = false) {
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/runs/${run.id}/evidence`, {
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
            setError(payload.error ?? "Failed to generate evidence.");
            return;
          }

          onRunChanged(payload.run);
        } catch (generationError) {
          setError(
            generationError instanceof Error
              ? generationError.message
              : "Failed to generate evidence."
          );
        }
      })();
    });
  }

  if (run.candidates.length === 0) {
    return (
      <p style={styles.waiting}>
        Evidence stays locked until candidates exist and the run reaches `candidates_ready`.
      </p>
    );
  }

  if (!canShowEvidencePanel(run.status)) {
    return (
      <p style={styles.waiting}>
        Confirm candidate recall first. Evidence only starts after the run becomes
        `candidates_ready`.
      </p>
    );
  }

  if (run.evidence.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.waiting}>
          Generate evidence to capture source-backed excerpts for the top-5 deep-dive
          candidates.
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => generateEvidence(false)}
          disabled={isPending}
          data-testid="generate-evidence"
        >
          {isPending ? "Generating..." : "Generate evidence"}
        </button>
        {error ? <p style={styles.error}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="evidence-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          Evidence is grouped by candidate and dimension, and every record keeps its source
          URL and extracted value.
        </p>
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => generateEvidence(true)}
          disabled={isPending}
          data-testid="regenerate-evidence"
        >
          {isPending ? "Refreshing..." : "Regenerate evidence"}
        </button>
      </div>

      <div style={styles.groups}>
        {Array.from(groupedEvidence.entries()).map(([candidateId, dimensions]) => (
          <section
            key={candidateId}
            style={styles.candidateGroup}
            data-testid="evidence-candidate-group"
          >
            <h3 style={styles.groupTitle}>
              {candidateNames.get(candidateId) ?? candidateId}
            </h3>
            <div style={styles.dimensionGroups}>
              {Array.from(dimensions.entries()).map(([dimensionId, records]) => (
                <article
                  key={`${candidateId}:${dimensionId}`}
                  style={styles.dimensionGroup}
                  data-testid="evidence-dimension-group"
                >
                  <strong>{dimensionNames.get(dimensionId) ?? dimensionId}</strong>
                  <div style={styles.records}>
                    {records.map((record, index) => (
                      <div
                        key={`${record.url}:${index}`}
                        style={styles.record}
                        data-testid="evidence-record"
                      >
                        <p style={styles.meta}>
                          {record.sourceType} | confidence {record.confidence.toFixed(2)}
                        </p>
                        <a
                          href={record.url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          {record.url}
                        </a>
                        <p style={styles.body}>{record.excerpt}</p>
                        <p style={styles.meta}>
                          Extracted value: {record.extractedValue}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
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
  groups: {
    display: "grid",
    gap: "16px"
  },
  candidateGroup: {
    background: "rgba(255,255,255,0.56)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "12px",
    padding: "16px"
  },
  groupTitle: {
    margin: 0
  },
  dimensionGroups: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
  },
  dimensionGroup: {
    display: "grid",
    gap: "10px"
  },
  records: {
    display: "grid",
    gap: "10px"
  },
  record: {
    background: "rgba(255,255,255,0.8)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    display: "grid",
    gap: "6px",
    padding: "12px"
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
