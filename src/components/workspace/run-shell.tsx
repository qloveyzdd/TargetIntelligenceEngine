import Link from "next/link";
import type { AnalysisRun } from "@/features/analysis-run/types";
import { AnalysisPlaceholders } from "./analysis-placeholders";

type RunShellProps = {
  run?: AnalysisRun | null;
};

export function RunShell({ run = null }: RunShellProps) {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Phase 1 Workspace</p>
          <h1 style={styles.title}>Target Intelligence Engine</h1>
          <p style={styles.subtitle}>
            先把分析容器搭好，再逐步接入 GoalCard、维度、候选、证据和阶段目标。
          </p>
        </div>
        {run ? (
          <div style={styles.runChip}>当前 run：{run.id}</div>
        ) : (
          <div style={styles.runChip}>准备创建第一条 analysis run</div>
        )}
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <p style={styles.sectionEyebrow}>Goal Input</p>
            <h2 style={styles.sectionTitle}>顶部输入区</h2>
          </div>
          <span style={styles.panelMeta}>Phase 1 skeleton</span>
        </div>
        <p style={styles.paragraph}>
          这里是目标描述和补充文本的入口。下一步会接入真实的 GoalCard 生成与编辑工作流，
          当前先把单页布局、容器层级和 run 上下文稳定下来。
        </p>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <p style={styles.sectionEyebrow}>GoalCard</p>
            <h2 style={styles.sectionTitle}>结构化目标区域</h2>
          </div>
          {run?.goal ? (
            <span style={styles.panelMeta}>已存在 GoalCard</span>
          ) : (
            <span style={styles.panelMeta}>等待 GoalCard</span>
          )}
        </div>
        {run?.goal ? (
          <dl style={styles.goalGrid}>
            <div style={styles.goalField}>
              <dt style={styles.goalLabel}>名称</dt>
              <dd style={styles.goalValue}>{run.goal.name}</dd>
            </div>
            <div style={styles.goalField}>
              <dt style={styles.goalLabel}>类别</dt>
              <dd style={styles.goalValue}>{run.goal.category}</dd>
            </div>
            <div style={styles.goalField}>
              <dt style={styles.goalLabel}>当前阶段</dt>
              <dd style={styles.goalValue}>{run.goal.currentStage}</dd>
            </div>
            <div style={styles.goalField}>
              <dt style={styles.goalLabel}>JTBD</dt>
              <dd style={styles.goalValue}>{run.goal.jobToBeDone}</dd>
            </div>
          </dl>
        ) : (
          <p style={styles.paragraph}>
            GoalCard 生成结果会显示在这里。当前阶段先展示容器，确保首页和 run
            详情页都能维持同一套骨架。
          </p>
        )}
      </section>

      {run ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Run Detail</p>
              <h2 style={styles.sectionTitle}>当前 run 数据</h2>
            </div>
            <Link href="/" style={styles.link}>
              返回首页
            </Link>
          </div>
          <p style={styles.paragraph}>
            当前状态：<strong>{run.status}</strong>
            {run.inputNotes ? ` · 补充文本：${run.inputNotes}` : " · 暂无补充文本"}
          </p>
        </section>
      ) : null}

      <AnalysisPlaceholders statusLabel={run?.status ?? "draft"} />
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
  goalGrid: {
    display: "grid",
    gap: "14px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    margin: 0
  },
  goalField: {
    background: "rgba(255,255,255,0.55)",
    borderRadius: "16px",
    padding: "16px"
  },
  goalLabel: {
    color: "var(--text-muted)",
    fontSize: "13px",
    marginBottom: "8px"
  },
  goalValue: {
    fontSize: "17px",
    margin: 0
  },
  link: {
    color: "var(--accent)",
    fontWeight: 600
  }
} satisfies Record<string, React.CSSProperties>;
