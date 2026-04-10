"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import type { AnalysisRun, Candidate } from "@/features/analysis-run/types";
import { DEEP_DIVE_LIMIT } from "@/features/candidate-recall/select-top-candidates";
import { ActionFeedback } from "./action-feedback";

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
  const [pendingAction, setPendingAction] = useState<"generate" | "regenerate" | null>(null);
  const [isPending, startTransition] = useTransition();

  function generateCandidates(forceRegenerate = false) {
    setError(null);
    setPendingAction(forceRegenerate ? "regenerate" : "generate");

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
            setError(payload.error ?? "生成候选失败。");
            setPendingAction(null);
            return;
          }

          onRunChanged(payload.run);
        } catch (generationError) {
          setError(
            generationError instanceof Error
              ? generationError.message
              : "生成候选失败。"
          );
          setPendingAction(null);
        }
      })();
    });
  }

  const feedback =
    error
      ? { tone: "error" as const, message: error }
      : isPending
        ? {
            tone: "pending" as const,
            message:
              pendingAction === "regenerate"
                ? "正在重新生成候选，请稍候……"
                : "正在生成候选，请稍候……"
          }
        : run.candidates.length > 0
          ? {
              tone: "success" as const,
              message:
                run.evidence.length > 0
                  ? "候选已生成，当前可以查看证据或重新召回。"
                  : "候选已生成，可继续采集证据。"
            }
          : {
              tone: "neutral" as const,
              message: "点击“生成候选”后，这里会显示召回进度和完成状态。"
            };

  if (!canShowCandidatePanel(run.status)) {
    return (
      <p style={styles.waiting}>
        候选列表要等搜索计划确认为 `search_plan_confirmed` 后才可用。
      </p>
    );
  }

  if (run.candidates.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.waiting}>
          搜索计划确认后，就可以生成候选召回。这里会产出有序候选列表，并标记前 5 个深挖对象供证据采集使用。
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => generateCandidates(false)}
          disabled={isPending}
          data-testid="generate-candidates"
        >
          {isPending ? "生成中..." : "生成候选"}
        </button>
        <ActionFeedback tone={feedback.tone} message={feedback.message} />
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="candidates-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          带有“深挖集合”标记的候选，会进入下一步证据采集。
        </p>
        <ActionFeedback tone={feedback.tone} message={feedback.message} />
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => generateCandidates(true)}
          disabled={isPending}
          data-testid="regenerate-candidates"
        >
          {isPending ? "刷新中..." : "重新生成候选"}
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
                <strong>
                  {candidate.recallRank}. {candidate.name}
                </strong>
                <p style={styles.meta}>模式：{candidate.matchedModes.join(", ")}</p>
              </div>
              {isDeepDiveCandidate(candidate) ? (
                <span style={styles.deepDiveBadge} data-testid="candidate-deep-dive-badge">
                  深挖集合
                </span>
              ) : null}
            </div>
            <p style={styles.body}>
              强项维度：
              {" "}
              {candidate.strengthDimensions.length > 0
                ? candidate.strengthDimensions.join(", ")
                : "暂时还没有明显信号"}
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
              <p style={styles.meta}>暂未识别到官网链接。</p>
            )}
            <p style={styles.meta}>命中检索词：{candidate.matchedQueries.join(" | ")}</p>
          </article>
        ))}
      </div>
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
    justifySelf: "start",
    padding: "12px 18px"
  }
} satisfies Record<string, CSSProperties>;
