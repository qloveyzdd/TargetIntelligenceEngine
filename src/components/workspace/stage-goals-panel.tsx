"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import type { AnalysisRun } from "@/features/analysis-run/types";
import type { StageGoalHandoff } from "@/features/stage-goals/build-stage-goal-handoff";

type StageGoalsPanelProps = {
  run: AnalysisRun;
  onRunChanged: (run: AnalysisRun) => void;
};

type RequestRunStageGoalsInput = {
  runId: string;
  forceRegenerate?: boolean;
  fetchImpl?: typeof fetch;
};

type RequestStageGoalHandoffInput = {
  runId: string;
  fetchImpl?: typeof fetch;
};

export async function requestRunStageGoals({
  runId,
  forceRegenerate = false,
  fetchImpl = fetch
}: RequestRunStageGoalsInput) {
  const response = await fetchImpl(`/api/runs/${runId}/stage-goals`, {
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
    throw new Error(payload.error ?? "Failed to generate stage goals.");
  }

  return payload.run;
}

export async function requestStageGoalHandoff({
  runId,
  fetchImpl = fetch
}: RequestStageGoalHandoffInput) {
  const response = await fetchImpl(`/api/runs/${runId}/handoff`, {
    method: "GET"
  });
  const payload = (await response.json()) as {
    error?: string;
    handoff?: StageGoalHandoff;
  };

  if (!response.ok || !payload.handoff) {
    throw new Error(payload.error ?? "Failed to load handoff.");
  }

  return payload.handoff;
}

async function copyToClipboard(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  await navigator.clipboard.writeText(value);
  return true;
}

function formatStageLabel(value: string) {
  if (value === "mvp") {
    return "MVP";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function StageGoalsPanel({ run, onRunChanged }: StageGoalsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("Ready to copy handoff.");
  const [handoff, setHandoff] = useState<StageGoalHandoff | null>(null);
  const [isGeneratingPending, startGenerateTransition] = useTransition();
  const [isHandoffPending, startHandoffTransition] = useTransition();

  function handleGenerateStageGoals(forceRegenerate = false) {
    setError(null);

    startGenerateTransition(() => {
      void (async () => {
        try {
          const nextRun = await requestRunStageGoals({
            runId: run.id,
            forceRegenerate
          });

          onRunChanged(nextRun);
        } catch (generationError) {
          setError(
            generationError instanceof Error
              ? generationError.message
              : "Failed to generate stage goals."
          );
        }
      })();
    });
  }

  function handlePreviewHandoff() {
    setHandoffError(null);

    startHandoffTransition(() => {
      void (async () => {
        try {
          const nextHandoff = await requestStageGoalHandoff({
            runId: run.id
          });

          setHandoff(nextHandoff);
        } catch (previewError) {
          setHandoffError(
            previewError instanceof Error ? previewError.message : "Failed to load handoff."
          );
        }
      })();
    });
  }

  function handleCopyHandoff() {
    setHandoffError(null);
    setCopyMessage("Copying handoff...");

    startHandoffTransition(() => {
      void (async () => {
        try {
          const nextHandoff =
            handoff ??
            (await requestStageGoalHandoff({
              runId: run.id
            }));
          const handoffText = JSON.stringify(nextHandoff, null, 2);

          setHandoff(nextHandoff);

          const copied = await copyToClipboard(handoffText);
          setCopyMessage(copied ? "Handoff copied." : "Clipboard unavailable. Preview stays below.");
        } catch (copyError) {
          setHandoffError(
            copyError instanceof Error ? copyError.message : "Failed to copy handoff."
          );
        }
      })();
    });
  }

  if (!run.scoring) {
    return (
      <p style={styles.waiting}>
        Stage goals stay locked until scoring and gap priorities have been generated.
      </p>
    );
  }

  if (run.stageGoals.length === 0) {
    return (
      <div style={styles.emptyState} data-testid="stage-goals-empty-state">
        <p style={styles.waiting}>
          Generate stage goals to turn persisted gaps into three evidence-backed phases:
          validation, MVP, and differentiation.
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => handleGenerateStageGoals(false)}
          disabled={isGeneratingPending}
          data-testid="generate-stage-goals"
        >
          {isGeneratingPending ? "Generating..." : "Generate stage goals"}
        </button>
        {error ? <p style={styles.error}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="stage-goals-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          Stage goals are persisted on the run and can be exported as structured handoff for
          the next planning step.
        </p>
        <div style={styles.buttonGroup}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => handleGenerateStageGoals(true)}
            disabled={isGeneratingPending}
            data-testid="regenerate-stage-goals"
          >
            {isGeneratingPending ? "Refreshing..." : "Regenerate stage goals"}
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handlePreviewHandoff}
            disabled={isHandoffPending}
            data-testid="preview-stage-goal-handoff"
          >
            {isHandoffPending ? "Loading..." : "Preview handoff"}
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleCopyHandoff}
            disabled={isHandoffPending}
            data-testid="copy-stage-goal-handoff"
          >
            {isHandoffPending ? "Copying..." : "Copy handoff"}
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {run.stageGoals.map((stageGoal) => (
          <article
            key={stageGoal.stage}
            style={styles.card}
            data-testid="stage-goal-card"
          >
            <div style={styles.cardHeader}>
              <strong>{formatStageLabel(stageGoal.stage)}</strong>
              <span style={styles.badge}>
                {stageGoal.relatedDimensions.length} dimension
                {stageGoal.relatedDimensions.length === 1 ? "" : "s"}
              </span>
            </div>
            <p style={styles.body}>{stageGoal.objective}</p>
            <p style={styles.meta}>
              Based on gaps:{" "}
              {stageGoal.basedOnGaps.length > 0 ? stageGoal.basedOnGaps.join(", ") : "none"}
            </p>
            <p style={styles.meta}>
              Reference products:{" "}
              {stageGoal.referenceProducts.length > 0
                ? stageGoal.referenceProducts.join(", ")
                : "none"}
            </p>
            <p style={styles.meta}>
              Success metrics: {stageGoal.successMetrics.join(" | ")}
            </p>
          </article>
        ))}
      </div>

      {handoff ? (
        <div style={styles.preview} data-testid="stage-goal-handoff-preview">
          <div style={styles.cardHeader}>
            <strong>Structured handoff preview</strong>
            <span style={styles.badge}>{handoff.generatedAt}</span>
          </div>
          <pre style={styles.pre}>{JSON.stringify(handoff, null, 2)}</pre>
        </div>
      ) : null}

      <p style={styles.meta} data-testid="stage-goal-copy-status">
        {copyMessage}
      </p>
      {error ? <p style={styles.error}>{error}</p> : null}
      {handoffError ? <p style={styles.error}>{handoffError}</p> : null}
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
  buttonGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
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
    background: "rgba(255,255,255,0.56)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "10px",
    padding: "16px"
  },
  cardHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between"
  },
  badge: {
    background: "var(--accent-soft)",
    borderRadius: "999px",
    color: "var(--accent)",
    fontSize: "12px",
    fontWeight: 600,
    padding: "6px 10px"
  },
  preview: {
    background: "rgba(255,255,255,0.56)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "12px",
    padding: "16px"
  },
  pre: {
    margin: 0,
    overflowX: "auto",
    whiteSpace: "pre-wrap"
  },
  body: {
    lineHeight: 1.6,
    margin: 0
  },
  meta: {
    color: "var(--text-muted)",
    fontSize: "13px",
    lineHeight: 1.6,
    margin: 0
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
