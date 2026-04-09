"use client";

import { useState, useTransition } from "react";
import type { AnalysisRun } from "@/features/analysis-run/types";

type GoalInputFormProps = {
  initialInputText?: string;
  initialInputNotes?: string | null;
  onRunChanged: (run: AnalysisRun) => void;
};

export function GoalInputForm({
  initialInputText = "",
  initialInputNotes = "",
  onRunChanged
}: GoalInputFormProps) {
  const [inputText, setInputText] = useState(initialInputText);
  const [inputNotes, setInputNotes] = useState(initialInputNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitGoalInput() {
    const draftResponse = await fetch("/api/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputText,
        inputNotes
      })
    });

    const draftPayload = (await draftResponse.json()) as {
      error?: string;
      run?: AnalysisRun;
    };

    if (!draftResponse.ok || !draftPayload.run) {
      throw new Error(draftPayload.error ?? "Failed to create a draft run.");
    }

    const goalResponse = await fetch("/api/goal-card/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputText,
        inputNotes
      })
    });

    const goalPayload = (await goalResponse.json()) as {
      error?: string;
      goal?: AnalysisRun["goal"];
    };

    if (!goalResponse.ok || !goalPayload.goal) {
      throw new Error(goalPayload.error ?? "Failed to generate the GoalCard.");
    }

    const runResponse = await fetch(`/api/runs/${draftPayload.run.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "goal_ready",
        inputNotes,
        goal: goalPayload.goal
      })
    });

    const runPayload = (await runResponse.json()) as {
      error?: string;
      run?: AnalysisRun;
    };

    if (!runResponse.ok || !runPayload.run) {
      throw new Error(runPayload.error ?? "Failed to update the run.");
    }

    onRunChanged(runPayload.run);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!inputText.trim()) {
      setError("Goal description is required.");
      return;
    }

    setError(null);

    startTransition(() => {
      void submitGoalInput().catch((submissionError) => {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Failed to generate the GoalCard."
        );
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form} data-testid="goal-input-form">
      <label style={styles.field}>
        <span style={styles.label}>Goal description</span>
        <textarea
          data-testid="goal-input-text"
          name="inputText"
          rows={5}
          style={styles.textarea}
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="Example: Build an evidence-first target intelligence engine for product planning."
        />
      </label>

      <label style={styles.field}>
        <span style={styles.label}>Supporting notes</span>
        <textarea
          data-testid="goal-input-notes"
          name="inputNotes"
          rows={4}
          style={styles.textarea}
          value={inputNotes}
          onChange={(event) => setInputNotes(event.target.value)}
          placeholder="Add budget, deployment mode, team size, or market constraints."
        />
      </label>

      <div style={styles.actions}>
        <button
          type="submit"
          style={styles.button}
          disabled={isPending}
          data-testid="generate-goal-card"
        >
          {isPending ? "Generating..." : "Generate GoalCard"}
        </button>
        {error ? <p style={styles.error}>{error}</p> : null}
      </div>
    </form>
  );
}

const styles = {
  form: {
    display: "grid",
    gap: "16px"
  },
  field: {
    display: "grid",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: 600
  },
  textarea: {
    background: "rgba(255,255,255,0.76)",
    border: "1px solid var(--card-border)",
    borderRadius: "16px",
    minHeight: "120px",
    padding: "14px 16px",
    resize: "vertical"
  },
  actions: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px"
  },
  button: {
    background: "var(--accent)",
    border: 0,
    borderRadius: "999px",
    color: "#fff",
    cursor: "pointer",
    padding: "12px 18px"
  },
  error: {
    color: "#b12424",
    margin: 0
  }
} satisfies Record<string, React.CSSProperties>;
