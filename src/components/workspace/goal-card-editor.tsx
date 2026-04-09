"use client";

import { useState, useTransition } from "react";
import type { AnalysisRun, GoalCard } from "@/features/analysis-run/types";

type GoalCardEditorProps = {
  run: AnalysisRun;
  onRunChanged: (run: AnalysisRun) => void;
};

function linesToArray(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function GoalCardEditor({ run, onRunChanged }: GoalCardEditorProps) {
  const [draft, setDraft] = useState<GoalCard | null>(run.goal);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hardConstraints = draft?.hardConstraints.join("\n") ?? "";
  const softPreferences = draft?.softPreferences.join("\n") ?? "";

  function updateDraft(next: GoalCard) {
    setDraft(next);
  }

  function saveRun(status: AnalysisRun["status"]) {
    if (!draft) {
      setError("There is no GoalCard to edit.");
      return;
    }

    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/runs/${run.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              goal: draft,
              inputNotes: run.inputNotes,
              status
            })
          });

          const payload = (await response.json()) as {
            error?: string;
            run?: AnalysisRun;
          };

          if (!response.ok || !payload.run) {
            setError(payload.error ?? "Failed to save the GoalCard.");
            return;
          }

          onRunChanged(payload.run);
        } catch (saveError) {
          setError(
            saveError instanceof Error ? saveError.message : "Failed to save the GoalCard."
          );
        }
      })();
    });
  }

  if (!draft) {
    return null;
  }

  return (
    <div style={styles.wrapper} data-testid="goal-card-editor">
      <div style={styles.grid}>
        <label style={styles.field}>
          <span style={styles.label}>Name</span>
          <input
            data-testid="goal-name-input"
            style={styles.input}
            value={draft.name}
            onChange={(event) =>
              updateDraft({
                ...draft,
                name: event.target.value
              })
            }
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Category</span>
          <input
            data-testid="goal-category-input"
            style={styles.input}
            value={draft.category}
            onChange={(event) =>
              updateDraft({
                ...draft,
                category: event.target.value
              })
            }
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Current stage</span>
          <select
            data-testid="goal-stage-select"
            style={styles.input}
            value={draft.currentStage}
            onChange={(event) =>
              updateDraft({
                ...draft,
                currentStage: event.target.value as GoalCard["currentStage"]
              })
            }
          >
            <option value="idea">idea</option>
            <option value="validation">validation</option>
            <option value="mvp">mvp</option>
            <option value="growth">growth</option>
          </select>
        </label>
      </div>

      <label style={styles.field}>
        <span style={styles.label}>Job to be done</span>
        <textarea
          data-testid="goal-jtbd-input"
          rows={4}
          style={styles.textarea}
          value={draft.jobToBeDone}
          onChange={(event) =>
            updateDraft({
              ...draft,
              jobToBeDone: event.target.value
            })
          }
        />
      </label>

      <div style={styles.grid}>
        <label style={styles.field}>
          <span style={styles.label}>Hard constraints</span>
          <textarea
            data-testid="goal-hard-constraints-input"
            rows={4}
            style={styles.textarea}
            value={hardConstraints}
            onChange={(event) =>
              updateDraft({
                ...draft,
                hardConstraints: linesToArray(event.target.value)
              })
            }
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Soft preferences</span>
          <textarea
            data-testid="goal-soft-preferences-input"
            rows={4}
            style={styles.textarea}
            value={softPreferences}
            onChange={(event) =>
              updateDraft({
                ...draft,
                softPreferences: linesToArray(event.target.value)
              })
            }
          />
        </label>
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.secondaryButton}
          disabled={isPending}
          onClick={() => saveRun("goal_ready")}
          data-testid="save-goal-card"
        >
          {isPending ? "Saving..." : "Save draft"}
        </button>
        <button
          type="button"
          style={styles.primaryButton}
          disabled={isPending}
          onClick={() => saveRun("goal_confirmed")}
          data-testid="confirm-goal-card"
        >
          {isPending ? "Confirming..." : "Confirm GoalCard"}
        </button>
        {error ? <p style={styles.error}>{error}</p> : null}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "16px"
  },
  grid: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))"
  },
  field: {
    display: "grid",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: 600
  },
  input: {
    background: "rgba(255,255,255,0.76)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    minHeight: "48px",
    padding: "12px 14px"
  },
  textarea: {
    background: "rgba(255,255,255,0.76)",
    border: "1px solid var(--card-border)",
    borderRadius: "16px",
    padding: "14px 16px",
    resize: "vertical"
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px"
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
