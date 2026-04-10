type AnalysisPlaceholdersProps = {
  statusLabel?: string;
  hasScoring?: boolean;
};

export function AnalysisPlaceholders({
  statusLabel = "draft",
  hasScoring = false
}: AnalysisPlaceholdersProps) {
  if (hasScoring) {
    return null;
  }

  return (
    <section style={styles.grid}>
      <article style={styles.card}>
        <div style={styles.badge}>Workspace status</div>
        <h3 style={styles.cardTitle}>Next layer unlocks after scoring</h3>
        <p style={styles.cardDescription}>
          Once scoring exists, the workspace will replace this status card with the real
          stage-goals and handoff surface.
        </p>
        <p style={styles.cardMeta}>Current run status: {statusLabel}</p>
      </article>
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
