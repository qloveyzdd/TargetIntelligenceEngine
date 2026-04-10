"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import type { AnalysisRun } from "@/features/analysis-run/types";
import type { StageGoalHandoff } from "@/features/stage-goals/build-stage-goal-handoff";
import { ActionFeedback } from "./action-feedback";

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
    throw new Error(payload.error ?? "生成阶段目标失败。");
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
    throw new Error(payload.error ?? "加载交接结果失败。");
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
  if (value === "validation") {
    return "验证阶段";
  }

  if (value === "mvp") {
    return "MVP 阶段";
  }

  if (value === "differentiation") {
    return "差异化阶段";
  }

  return value;
}

export function StageGoalsPanel({ run, onRunChanged }: StageGoalsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("点击预览或复制后，这里会显示交接结果状态。");
  const [handoff, setHandoff] = useState<StageGoalHandoff | null>(null);
  const [pendingAction, setPendingAction] = useState<"generate" | "regenerate" | null>(null);
  const [handoffAction, setHandoffAction] = useState<"preview" | "copy" | null>(null);
  const [isGeneratingPending, startGenerateTransition] = useTransition();
  const [isHandoffPending, startHandoffTransition] = useTransition();

  function handleGenerateStageGoals(forceRegenerate = false) {
    setError(null);
    setPendingAction(forceRegenerate ? "regenerate" : "generate");

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
              : "生成阶段目标失败。"
          );
          setPendingAction(null);
        }
      })();
    });
  }

  function handlePreviewHandoff() {
    setHandoffError(null);
    setCopyMessage("正在加载交接结果，请稍候……");
    setHandoffAction("preview");

    startHandoffTransition(() => {
      void (async () => {
        try {
          const nextHandoff = await requestStageGoalHandoff({
            runId: run.id
          });

          setHandoff(nextHandoff);
          setCopyMessage("交接结果已加载，可直接复制给下一轮规划使用。");
        } catch (previewError) {
          setHandoffError(
            previewError instanceof Error ? previewError.message : "加载交接结果失败。"
          );
          setHandoffAction(null);
        }
      })();
    });
  }

  function handleCopyHandoff() {
    setHandoffError(null);
    setCopyMessage("正在复制交接结果，请稍候……");
    setHandoffAction("copy");

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
          setCopyMessage(
            copied
              ? "已复制交接结果。"
              : "当前环境不支持剪贴板，请直接查看下方预览。"
          );
        } catch (copyError) {
          setHandoffError(
            copyError instanceof Error ? copyError.message : "复制交接结果失败。"
          );
          setHandoffAction(null);
        }
      })();
    });
  }

  const generationFeedback =
    error
      ? { tone: "error" as const, message: error }
      : isGeneratingPending
        ? {
            tone: "pending" as const,
            message:
              pendingAction === "regenerate"
                ? "正在重新生成阶段目标，请稍候……"
                : "正在生成阶段目标，请稍候……"
          }
        : run.stageGoals.length > 0
          ? {
              tone: "success" as const,
              message: "阶段目标已生成，可继续预览或复制交接结果。"
            }
          : {
              tone: "neutral" as const,
              message: "点击“生成阶段目标”后，这里会显示进度和完成状态。"
            };

  const handoffFeedback =
    handoffError
      ? { tone: "error" as const, message: handoffError }
      : isHandoffPending
        ? {
            tone: "pending" as const,
            message:
              handoffAction === "copy"
                ? "正在准备并复制交接结果，请稍候……"
                : "正在加载交接结果，请稍候……"
          }
        : handoff
          ? {
              tone: "success" as const,
              message: copyMessage
            }
          : {
              tone: "neutral" as const,
              message: copyMessage
            };

  if (!run.scoring) {
    return (
      <p style={styles.waiting}>
        只有先生成评分和差距优先级，阶段目标面板才会解锁。
      </p>
    );
  }

  if (run.stageGoals.length === 0) {
    return (
      <div style={styles.emptyState} data-testid="stage-goals-empty-state">
        <p style={styles.waiting}>
          生成阶段目标后，持久化差距会被整理成 3 个有证据支撑的阶段：验证、MVP 和差异化。
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => handleGenerateStageGoals(false)}
          disabled={isGeneratingPending}
          data-testid="generate-stage-goals"
        >
          {isGeneratingPending ? "生成中..." : "生成阶段目标"}
        </button>
        <ActionFeedback
          tone={generationFeedback.tone}
          message={generationFeedback.message}
        />
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="stage-goals-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          阶段目标会持久化在当前运行上，并可导出成结构化交接结果。
        </p>
        <ActionFeedback
          tone={generationFeedback.tone}
          message={generationFeedback.message}
        />
        <div style={styles.buttonGroup}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => handleGenerateStageGoals(true)}
            disabled={isGeneratingPending}
            data-testid="regenerate-stage-goals"
          >
            {isGeneratingPending ? "刷新中..." : "重新生成阶段目标"}
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handlePreviewHandoff}
            disabled={isHandoffPending}
            data-testid="preview-stage-goal-handoff"
          >
            {isHandoffPending && handoffAction === "preview" ? "加载中..." : "预览交接结果"}
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleCopyHandoff}
            disabled={isHandoffPending}
            data-testid="copy-stage-goal-handoff"
          >
            {isHandoffPending && handoffAction === "copy" ? "复制中..." : "复制交接结果"}
          </button>
        </div>
        <ActionFeedback tone={handoffFeedback.tone} message={handoffFeedback.message} />
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
                {stageGoal.relatedDimensions.length} 个维度
              </span>
            </div>
            <p style={styles.body}>{stageGoal.objective}</p>
            <p style={styles.meta}>
              基于差距：
              {" "}
              {stageGoal.basedOnGaps.length > 0 ? stageGoal.basedOnGaps.join(", ") : "无"}
            </p>
            <p style={styles.meta}>
              参考产品：
              {" "}
              {stageGoal.referenceProducts.length > 0
                ? stageGoal.referenceProducts.join(", ")
                : "无"}
            </p>
            <p style={styles.meta}>
              成功指标：{stageGoal.successMetrics.join(" | ")}
            </p>
          </article>
        ))}
      </div>

      {handoff ? (
        <div style={styles.preview} data-testid="stage-goal-handoff-preview">
          <div style={styles.cardHeader}>
            <strong>结构化交接预览</strong>
            <span style={styles.badge}>{handoff.generatedAt}</span>
          </div>
          <pre style={styles.pre}>{JSON.stringify(handoff, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "16px"
  },
  toolbar: {
    display: "grid",
    gap: "12px"
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
  }
} satisfies Record<string, CSSProperties>;
