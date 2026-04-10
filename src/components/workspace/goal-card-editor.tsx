"use client";

import { useState, useTransition } from "react";
import type { AnalysisRun, GoalCard } from "@/features/analysis-run/types";
import { ActionFeedback } from "./action-feedback";

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
  const [pendingAction, setPendingAction] = useState<"save" | "confirm" | null>(null);
  const [isPending, startTransition] = useTransition();
  const hardConstraints = draft?.hardConstraints.join("\n") ?? "";
  const softPreferences = draft?.softPreferences.join("\n") ?? "";

  function updateDraft(next: GoalCard) {
    setDraft(next);
  }

  function saveRun(status: AnalysisRun["status"]) {
    if (!draft) {
      setError("当前没有可编辑的 GoalCard。");
      return;
    }

    setError(null);
    setPendingAction(status === "goal_confirmed" ? "confirm" : "save");

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
            setError(payload.error ?? "保存 GoalCard 失败。");
            setPendingAction(null);
            return;
          }

          onRunChanged(payload.run);
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : "保存 GoalCard 失败。");
          setPendingAction(null);
        }
      })();
    });
  }

  if (!draft) {
    return null;
  }

  const feedback =
    error
      ? { tone: "error" as const, message: error }
      : isPending
        ? {
            tone: "pending" as const,
            message:
              pendingAction === "confirm"
                ? "正在确认 GoalCard，请稍候……"
                : "正在保存 GoalCard 草稿，请稍候……"
          }
        : run.status === "goal_confirmed"
          ? {
              tone: "success" as const,
              message: "GoalCard 已确认，可继续生成维度草稿。"
            }
          : {
              tone: "success" as const,
              message: "GoalCard 草稿已就绪，可继续修改或直接确认。"
            };

  return (
    <div style={styles.wrapper} data-testid="goal-card-editor">
      <div style={styles.grid}>
        <label style={styles.field}>
          <span style={styles.label}>名称</span>
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
          <span style={styles.label}>类别</span>
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
          <span style={styles.label}>当前阶段</span>
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
            <option value="idea">想法</option>
            <option value="validation">验证</option>
            <option value="mvp">MVP</option>
            <option value="growth">增长</option>
          </select>
        </label>
      </div>

      <label style={styles.field}>
        <span style={styles.label}>核心任务</span>
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
          <span style={styles.label}>硬约束</span>
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
          <span style={styles.label}>软偏好</span>
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

      <ActionFeedback tone={feedback.tone} message={feedback.message} />

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.secondaryButton}
          disabled={isPending}
          onClick={() => saveRun("goal_ready")}
          data-testid="save-goal-card"
        >
          {isPending ? "保存中..." : "保存草稿"}
        </button>
        <button
          type="button"
          style={styles.primaryButton}
          disabled={isPending}
          onClick={() => saveRun("goal_confirmed")}
          data-testid="confirm-goal-card"
        >
          {isPending ? "确认中..." : "确认 GoalCard"}
        </button>
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
  }
} satisfies Record<string, React.CSSProperties>;
