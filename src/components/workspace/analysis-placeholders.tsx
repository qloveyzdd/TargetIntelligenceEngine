type AnalysisPlaceholdersProps = {
  statusLabel?: string;
};

const sections = [
  {
    title: "Stage Goals",
    description:
      "Stage goals stay as the remaining placeholder until scoring and the gap engine can produce evidence-backed milestones."
  }
];

export function AnalysisPlaceholders({
  statusLabel = "draft"
}: AnalysisPlaceholdersProps) {
  return (
    <section style={styles.grid}>
      {sections.map((section) => (
        <article key={section.title} style={styles.card}>
          <div style={styles.badge}>Placeholder after Evidence</div>
          <h3 style={styles.cardTitle}>{section.title}</h3>
          <p style={styles.cardDescription}>{section.description}</p>
          <p style={styles.cardMeta}>Current run status: {statusLabel}</p>
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
