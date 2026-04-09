import Link from "next/link";
import type { CSSProperties } from "react";
import { RunShell } from "@/components/workspace/run-shell";
import { getRunById } from "@/features/analysis-run/repository";

type RunDetailPageProps = {
  params: Promise<{
    runId: string;
  }>;
};

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { runId } = await params;
  const run = await getRunById(runId);

  if (!run) {
    return (
      <main style={styles.emptyPage}>
        <article style={styles.emptyCard}>
          <p style={styles.eyebrow}>Run Detail</p>
          <h1 style={styles.title}>The requested analysis run was not found</h1>
          <p style={styles.description}>
            The current <code>runId</code> is <code>{runId}</code>. This usually means
            the run has not been created yet, or the active store does not contain it.
          </p>
          <Link href="/" style={styles.link}>
            Back to home
          </Link>
        </article>
      </main>
    );
  }

  return <RunShell run={run} />;
}

const styles = {
  emptyPage: {
    display: "grid",
    minHeight: "100vh",
    padding: "40px 20px",
    placeItems: "center"
  },
  emptyCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--panel-shadow)",
    maxWidth: "640px",
    padding: "32px"
  },
  eyebrow: {
    color: "var(--accent)",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    margin: "0 0 8px",
    textTransform: "uppercase"
  },
  title: {
    margin: "0 0 12px"
  },
  description: {
    color: "var(--text-muted)",
    lineHeight: 1.8,
    margin: "0 0 16px"
  },
  link: {
    color: "var(--accent)",
    fontWeight: 600
  }
} satisfies Record<string, CSSProperties>;
