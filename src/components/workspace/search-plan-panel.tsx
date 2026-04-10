"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import type { AnalysisRun, SearchPlanItem } from "@/features/analysis-run/types";
import { ActionFeedback } from "./action-feedback";

type SearchPlanPanelProps = {
  run: AnalysisRun;
  onRunChanged: (run: AnalysisRun) => void;
};

function groupItems(items: SearchPlanItem[], mode: SearchPlanItem["mode"]) {
  return items.filter((item) => item.mode === mode);
}

export function SearchPlanPanel({ run, onRunChanged }: SearchPlanPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"generate" | "regenerate" | "confirm" | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const searchPlan = run.searchPlan;
  const dimensionNames = new Map(run.dimensions.map((dimension) => [dimension.id, dimension.name]));

  function generateSearchPlan(forceRegenerate = false) {
    setError(null);
    setPendingAction(forceRegenerate ? "regenerate" : "generate");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/runs/${run.id}/search-plan`, {
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
            setError(payload.error ?? "生成搜索计划失败。");
            setPendingAction(null);
            return;
          }

          onRunChanged(payload.run);
        } catch (generationError) {
          setError(
            generationError instanceof Error
              ? generationError.message
              : "生成搜索计划失败。"
          );
          setPendingAction(null);
        }
      })();
    });
  }

  function confirmSearchPlan() {
    if (!searchPlan) {
      return;
    }

    setError(null);
    setPendingAction("confirm");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/runs/${run.id}/search-plan`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              searchPlan
            })
          });
          const payload = (await response.json()) as {
            error?: string;
            run?: AnalysisRun;
          };

          if (!response.ok || !payload.run) {
            setError(payload.error ?? "确认搜索计划失败。");
            setPendingAction(null);
            return;
          }

          onRunChanged(payload.run);
        } catch (confirmError) {
          setError(
            confirmError instanceof Error ? confirmError.message : "确认搜索计划失败。"
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
              pendingAction === "confirm"
                ? "正在确认搜索计划，请稍候……"
                : pendingAction === "regenerate"
                  ? "正在重新生成搜索计划，请稍候……"
                  : "正在生成搜索计划，请稍候……"
          }
        : searchPlan?.status === "confirmed"
          ? {
              tone: "success" as const,
              message: "搜索计划已确认，可继续生成候选。"
            }
          : searchPlan
            ? {
                tone: "success" as const,
                message: "搜索计划草稿已生成，请确认后进入候选召回。"
              }
            : {
                tone: "neutral" as const,
                message: "点击“生成搜索计划”后，这里会显示处理进度和确认状态。"
              };

  if (
    run.status !== "dimensions_ready" &&
    run.status !== "search_plan_ready" &&
    run.status !== "search_plan_confirmed" &&
    run.status !== "candidates_ready" &&
    run.status !== "evidence_ready"
  ) {
    return (
      <p style={styles.waiting}>
        搜索计划要等维度保存为 `dimensions_ready` 后才可用。
      </p>
    );
  }

  if (!searchPlan) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.waiting}>
          维度确认后再生成搜索计划草稿。这里展示的是“接下来要搜什么、为什么搜”，不是候选结果本身。
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => generateSearchPlan(false)}
          disabled={isPending}
          data-testid="generate-search-plan"
        >
          {isPending ? "生成中..." : "生成搜索计划"}
        </button>
        <ActionFeedback tone={feedback.tone} message={feedback.message} />
      </div>
    );
  }

  const sameGoalItems = groupItems(searchPlan.items, "same_goal");
  const leaderItems = groupItems(searchPlan.items, "dimension_leader");

  return (
    <div style={styles.wrapper} data-testid="search-plan-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          在真正开始召回候选之前，先确认这份搜索计划草稿。
        </p>
        <ActionFeedback tone={feedback.tone} message={feedback.message} />
        <div style={styles.actions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => generateSearchPlan(true)}
            disabled={isPending}
            data-testid="regenerate-search-plan"
          >
            {isPending ? "刷新中..." : "重新生成草稿"}
          </button>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={confirmSearchPlan}
            disabled={isPending || searchPlan.status === "confirmed"}
            data-testid="confirm-search-plan"
          >
            {searchPlan.status === "confirmed"
              ? "搜索计划已确认"
              : isPending
                ? "确认中..."
                : "确认搜索计划"}
          </button>
        </div>
      </div>

      <section style={styles.group} data-testid="search-plan-group-same_goal">
        <h3 style={styles.groupTitle}>同目标检索</h3>
        <div style={styles.grid}>
          {sameGoalItems.map((item) => (
            <article
              key={item.id}
              style={styles.card}
              data-testid={`search-plan-item-${item.id}`}
            >
              <strong>{item.query}</strong>
              <p style={styles.meta}>预计候选数：{item.expectedCandidateCount}</p>
              <p style={styles.body}>{item.whatToFind}</p>
              <p style={styles.body}>{item.whyThisSearch}</p>
              <p style={styles.meta}>来源提示：{item.sourceHints.join(", ")}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.group} data-testid="search-plan-group-dimension_leader">
        <h3 style={styles.groupTitle}>维度冠军检索</h3>
        <div style={styles.grid}>
          {leaderItems.map((item) => (
            <article
              key={item.id}
              style={styles.card}
              data-testid={`search-plan-item-${item.id}`}
            >
              <strong>{dimensionNames.get(item.dimensionId ?? "") ?? item.dimensionId}</strong>
              <p style={styles.meta}>检索词：{item.query}</p>
              <p style={styles.body}>{item.whatToFind}</p>
              <p style={styles.body}>{item.whyThisSearch}</p>
              <p style={styles.meta}>来源提示：{item.sourceHints.join(", ")}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "20px"
  },
  toolbar: {
    display: "grid",
    gap: "12px"
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
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
  group: {
    display: "grid",
    gap: "12px"
  },
  groupTitle: {
    margin: 0
  },
  grid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
  },
  card: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "8px",
    padding: "16px"
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
