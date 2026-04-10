"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import type { AnalysisRun, Dimension } from "@/features/analysis-run/types";
import { AnalysisPlaceholders } from "./analysis-placeholders";
import { CandidatesPanel } from "./candidates-panel";
import { DimensionEditor } from "./dimension-editor";
import { EvidencePanel } from "./evidence-panel";
import { GoalCardEditor } from "./goal-card-editor";
import { GoalInputForm } from "./goal-input-form";
import { ScoringPanel } from "./scoring-panel";
import { SearchPlanPanel } from "./search-plan-panel";
import { StageGoalsPanel } from "./stage-goals-panel";
import { VisualIntelligenceSurface } from "./visual-intelligence-surface";

type RunShellProps = {
  run?: AnalysisRun | null;
};

type DimensionSummaryProps = {
  dimensions: Dimension[];
};

function formatDirectionLabel(direction: Dimension["direction"]) {
  return direction === "higher_better" ? "越高越好" : "越低越好";
}

function formatRunStatus(status: AnalysisRun["status"]) {
  switch (status) {
    case "draft":
      return "草稿";
    case "goal_ready":
      return "GoalCard 待确认";
    case "goal_confirmed":
      return "GoalCard 已确认";
    case "dimensions_ready":
      return "维度已确认";
    case "search_plan_ready":
      return "检索计划草稿";
    case "search_plan_confirmed":
      return "检索计划已确认";
    case "candidates_ready":
      return "候选已生成";
    case "evidence_ready":
      return "证据已生成";
    default:
      return status;
  }
}

function DimensionSummary({ dimensions }: DimensionSummaryProps) {
  if (dimensions.length === 0) {
    return (
      <div style={styles.dimensionEmpty}>
        确认 GoalCard 后，会自动注入初始 6 个核心维度。
      </div>
    );
  }

  return (
    <div style={styles.dimensionBlock} data-testid="dimension-summary">
      <div style={styles.panelHeader}>
        <div>
          <p style={styles.sectionEyebrow}>维度</p>
          <h3 style={styles.dimensionTitle}>当前维度</h3>
        </div>
        <span style={styles.panelMeta}>{dimensions.length} 项</span>
      </div>
      <div style={styles.dimensionGrid}>
        {dimensions.map((dimension) => (
          <article
            key={dimension.id}
            style={styles.dimensionCard}
            data-testid="dimension-card"
          >
            <strong>{dimension.name}</strong>
            <p style={styles.dimensionMeta}>
              权重：{dimension.weight.toFixed(3)} | 方向：{formatDirectionLabel(dimension.direction)}
            </p>
            <p style={styles.dimensionDefinition}>{dimension.definition}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

type RequestRunScoringInput = {
  runId: string;
  forceRegenerate?: boolean;
  fetchImpl?: typeof fetch;
};

export async function requestRunScoring({
  runId,
  forceRegenerate = false,
  fetchImpl = fetch
}: RequestRunScoringInput) {
  const response = await fetchImpl(`/api/runs/${runId}/scoring`, {
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
    throw new Error(payload.error ?? "生成评分失败。");
  }

  return payload.run;
}

export function RunShell({ run = null }: RunShellProps) {
  const [currentRun, setCurrentRun] = useState<AnalysisRun | null>(run);
  const [scoringError, setScoringError] = useState<string | null>(null);
  const [isScoringPending, startScoringTransition] = useTransition();

  function handleGenerateScoring(forceRegenerate = false) {
    if (!currentRun) {
      return;
    }

    setScoringError(null);

    startScoringTransition(() => {
      void (async () => {
        try {
          const nextRun = await requestRunScoring({
            runId: currentRun.id,
            forceRegenerate
          });

          setCurrentRun(nextRun);
        } catch (error) {
          setScoringError(
            error instanceof Error ? error.message : "生成评分失败。"
          );
        }
      })();
    });
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>分析工作台</p>
          <h1 style={styles.title}>目标情报引擎</h1>
          <p style={styles.subtitle}>
            先建立稳定的分析容器，再逐步叠加 GoalCard、维度、候选、证据和阶段目标。
          </p>
        </div>
        {currentRun ? (
          <div style={styles.runChip}>当前运行：{currentRun.id}</div>
        ) : (
          <div style={styles.runChip}>准备创建第一个分析运行</div>
        )}
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <p style={styles.sectionEyebrow}>目标输入</p>
            <h2 style={styles.sectionTitle}>输入区</h2>
          </div>
          <span style={styles.panelMeta}>目标表单</span>
        </div>
        <GoalInputForm
          initialInputText={currentRun?.inputText ?? ""}
          initialInputNotes={currentRun?.inputNotes ?? ""}
          onRunChanged={setCurrentRun}
        />
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <p style={styles.sectionEyebrow}>GoalCard</p>
            <h2 style={styles.sectionTitle}>结构化目标区</h2>
          </div>
          {currentRun?.goal ? (
            <span style={styles.panelMeta}>GoalCard 已生成</span>
          ) : (
            <span style={styles.panelMeta}>等待生成 GoalCard</span>
          )}
        </div>
        {currentRun?.goal ? (
          <GoalCardEditor
            key={`${currentRun.id}:${currentRun.updatedAt}`}
            run={currentRun}
            onRunChanged={setCurrentRun}
          />
        ) : (
          <p style={styles.paragraph}>
            这里会展示生成后的 GoalCard。顶部表单完成后，这块区域会切换成可编辑表单，方便你确认结果。
          </p>
        )}
      </section>

      {currentRun ? (
        <section style={styles.panel} data-testid="run-detail-panel">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>运行详情</p>
              <h2 style={styles.sectionTitle}>当前运行数据</h2>
            </div>
            <div style={styles.linkGroup}>
              <Link href="/" style={styles.link}>
                返回首页
              </Link>
              <Link
                href={`/runs/${currentRun.id}`}
                style={styles.link}
                data-testid="open-run-detail"
              >
                打开详情页
              </Link>
            </div>
          </div>
          <p style={styles.paragraph}>
            当前状态：<strong>{formatRunStatus(currentRun.status)}</strong>
            {currentRun.inputNotes
              ? ` | 补充说明：${currentRun.inputNotes}`
              : " | 没有补充说明"}
          </p>
          <DimensionSummary dimensions={currentRun.dimensions} />
        </section>
      ) : null}

      {currentRun ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>维度</p>
              <h2 style={styles.sectionTitle}>可编辑维度草稿</h2>
            </div>
            <span style={styles.panelMeta}>
              {currentRun.status === "dimensions_ready" ? "维度已确认" : "草稿编辑中"}
            </span>
          </div>
          <DimensionEditor
            key={`${currentRun.id}:${currentRun.updatedAt}:dimensions`}
            run={currentRun}
            onRunChanged={setCurrentRun}
          />
        </section>
      ) : null}

      {currentRun ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>SearchPlan</p>
              <h2 style={styles.sectionTitle}>可解释检索计划</h2>
            </div>
            <span style={styles.panelMeta}>
              {currentRun.searchPlan ? (currentRun.searchPlan.status === "confirmed" ? "已确认" : "草稿") : "未生成"}
            </span>
          </div>
          <SearchPlanPanel
            key={`${currentRun.id}:${currentRun.updatedAt}:search-plan`}
            run={currentRun}
            onRunChanged={setCurrentRun}
          />
        </section>
      ) : null}

      {currentRun ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>候选</p>
              <h2 style={styles.sectionTitle}>候选召回</h2>
            </div>
            <span style={styles.panelMeta}>
              {currentRun.candidates.length > 0 ? `${currentRun.candidates.length} 个候选` : "未生成"}
            </span>
          </div>
          <CandidatesPanel
            key={`${currentRun.id}:${currentRun.updatedAt}:candidates`}
            run={currentRun}
            onRunChanged={setCurrentRun}
          />
        </section>
      ) : null}

      {currentRun ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>证据</p>
              <h2 style={styles.sectionTitle}>证据采集</h2>
            </div>
            <span style={styles.panelMeta}>
              {currentRun.evidence.length > 0 ? `${currentRun.evidence.length} 条记录` : "未生成"}
            </span>
          </div>
          <EvidencePanel
            key={`${currentRun.id}:${currentRun.updatedAt}:evidence`}
            run={currentRun}
            onRunChanged={setCurrentRun}
          />
        </section>
      ) : null}

      {currentRun ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>评分</p>
              <h2 style={styles.sectionTitle}>可解释评分与差距</h2>
            </div>
            <span style={styles.panelMeta}>
              {currentRun.scoring ? "评分已生成" : "未生成"}
            </span>
          </div>
          <ScoringPanel
            run={currentRun}
            isPending={isScoringPending}
            error={scoringError}
            onGenerate={handleGenerateScoring}
          />
        </section>
      ) : null}

      {currentRun?.scoring ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>可视化</p>
              <h2 style={styles.sectionTitle}>雷达图与关系图</h2>
            </div>
            <span style={styles.panelMeta}>可视化已就绪</span>
          </div>
          <VisualIntelligenceSurface
            key={`${currentRun.id}:${currentRun.updatedAt}:visual-surface`}
            run={currentRun}
          />
        </section>
      ) : null}

      {currentRun?.scoring ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>阶段目标</p>
              <h2 style={styles.sectionTitle}>阶段目标与交接输出</h2>
            </div>
            <span style={styles.panelMeta}>
              {currentRun.stageGoals.length > 0 ? `${currentRun.stageGoals.length} 个阶段目标` : "未生成"}
            </span>
          </div>
          <StageGoalsPanel
            key={`${currentRun.id}:${currentRun.updatedAt}:stage-goals`}
            run={currentRun}
            onRunChanged={setCurrentRun}
          />
        </section>
      ) : null}

      <AnalysisPlaceholders
        statusLabel={currentRun ? formatRunStatus(currentRun.status) : "草稿"}
        hasScoring={Boolean(currentRun?.scoring)}
      />
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "24px",
    margin: "0 auto",
    maxWidth: "1120px",
    padding: "48px 20px 64px"
  },
  hero: {
    alignItems: "end",
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "space-between"
  },
  eyebrow: {
    color: "var(--accent)",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    margin: "0 0 10px",
    textTransform: "uppercase"
  },
  title: {
    fontSize: "clamp(40px, 7vw, 72px)",
    lineHeight: 0.95,
    margin: "0 0 12px"
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "18px",
    lineHeight: 1.7,
    margin: 0,
    maxWidth: "720px"
  },
  runChip: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "999px",
    boxShadow: "var(--panel-shadow)",
    padding: "12px 18px"
  },
  panel: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--panel-shadow)",
    padding: "28px"
  },
  panelHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "space-between",
    marginBottom: "16px"
  },
  sectionEyebrow: {
    color: "var(--accent)",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    margin: "0 0 8px",
    textTransform: "uppercase"
  },
  sectionTitle: {
    fontSize: "28px",
    margin: 0
  },
  panelMeta: {
    background: "var(--accent-soft)",
    borderRadius: "999px",
    color: "var(--accent)",
    fontSize: "12px",
    padding: "8px 12px"
  },
  paragraph: {
    color: "var(--text-muted)",
    fontSize: "16px",
    lineHeight: 1.8,
    margin: 0
  },
  link: {
    color: "var(--accent)",
    fontWeight: 600
  },
  linkGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px"
  },
  dimensionBlock: {
    display: "grid",
    gap: "16px",
    marginTop: "20px"
  },
  dimensionTitle: {
    fontSize: "22px",
    margin: 0
  },
  dimensionGrid: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
  },
  dimensionCard: {
    background: "rgba(255,255,255,0.6)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "8px",
    padding: "16px"
  },
  dimensionMeta: {
    color: "var(--text-muted)",
    fontSize: "13px",
    margin: 0
  },
  dimensionDefinition: {
    color: "var(--text-muted)",
    lineHeight: 1.6,
    margin: 0
  },
  dimensionEmpty: {
    background: "rgba(255,255,255,0.6)",
    border: "1px dashed var(--card-border)",
    borderRadius: "18px",
    color: "var(--text-muted)",
    marginTop: "20px",
    padding: "18px"
  }
} satisfies Record<string, CSSProperties>;
