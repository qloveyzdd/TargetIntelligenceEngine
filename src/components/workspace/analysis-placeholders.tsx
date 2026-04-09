type AnalysisPlaceholdersProps = {
  statusLabel?: string;
};

const sections = [
  {
    title: "Candidates",
    description: "Phase 1 先保留候选产品区域，后续 phase 再接入 same_goal 和 dimension_leader 召回。"
  },
  {
    title: "Evidence",
    description: "证据链将在后续 phase 接入白名单公开资料抓取与结构化抽取。"
  },
  {
    title: "Stage Goals",
    description: "阶段目标会在 gap engine 具备之后生成，这里先保留容器。"
  }
];

export function AnalysisPlaceholders({
  statusLabel = "draft"
}: AnalysisPlaceholdersProps) {
  return (
    <section style={styles.grid}>
      {sections.map((section) => (
        <article key={section.title} style={styles.card}>
          <div style={styles.badge}>Phase 1 placeholder</div>
          <h3 style={styles.cardTitle}>{section.title}</h3>
          <p style={styles.cardDescription}>{section.description}</p>
          <p style={styles.cardMeta}>当前 run 状态：{statusLabel}</p>
        </article>
      ))}
    </section>
  );
}

const styles = {
  grid: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
  },
  card: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--panel-shadow)",
    padding: "20px"
  },
  badge: {
    background: "var(--accent-soft)",
    borderRadius: "999px",
    color: "var(--accent)",
    display: "inline-flex",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "14px",
    padding: "6px 10px"
  },
  cardTitle: {
    fontSize: "20px",
    margin: "0 0 10px"
  },
  cardDescription: {
    color: "var(--text-muted)",
    lineHeight: 1.6,
    margin: "0 0 14px"
  },
  cardMeta: {
    fontSize: "13px",
    margin: 0
  }
} satisfies Record<string, React.CSSProperties>;
