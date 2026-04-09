"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import type { AnalysisRun, Dimension } from "@/features/analysis-run/types";
import { AnalysisPlaceholders } from "./analysis-placeholders";
import { DimensionEditor } from "./dimension-editor";
import { GoalCardEditor } from "./goal-card-editor";
import { GoalInputForm } from "./goal-input-form";
import { SearchPlanPanel } from "./search-plan-panel";

type RunShellProps = {
  run?: AnalysisRun | null;
};

type DimensionSummaryProps = {
  dimensions: Dimension[];
};

function DimensionSummary({ dimensions }: DimensionSummaryProps) {
  if (dimensions.length === 0) {
    return (
      <div style={styles.dimensionEmpty}>
        Confirm the GoalCard to inject the initial six core dimensions.
      </div>
    );
  }

  return (
    <div style={styles.dimensionBlock} data-testid="dimension-summary">
      <div style={styles.panelHeader}>
        <div>
          <p style={styles.sectionEyebrow}>Dimensions</p>
          <h3 style={styles.dimensionTitle}>Initial core dimensions</h3>
        </div>
        <span style={styles.panelMeta}>{dimensions.length} items</span>
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
              Weight: {dimension.weight.toFixed(3)} | Direction: {dimension.direction}
            </p>
            <p style={styles.dimensionDefinition}>{dimension.definition}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function RunShell({ run = null }: RunShellProps) {
  const [currentRun, setCurrentRun] = useState<AnalysisRun | null>(run);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Phase 1 Workspace</p>
          <h1 style={styles.title}>Target Intelligence Engine</h1>
          <p style={styles.subtitle}>
            Start with a stable analysis container, then add GoalCard, dimensions,
            candidates, evidence, and stage goals on top of it.
          </p>
        </div>
        {currentRun ? (
          <div style={styles.runChip}>Current run: {currentRun.id}</div>
        ) : (
          <div style={styles.runChip}>Ready to create the first analysis run</div>
        )}
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <p style={styles.sectionEyebrow}>Goal Input</p>
            <h2 style={styles.sectionTitle}>Top input area</h2>
          </div>
          <span style={styles.panelMeta}>GoalInputForm</span>
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
            <h2 style={styles.sectionTitle}>Structured goal area</h2>
          </div>
          {currentRun?.goal ? (
            <span style={styles.panelMeta}>GoalCard ready</span>
          ) : (
            <span style={styles.panelMeta}>Waiting for GoalCard</span>
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
            The generated GoalCard appears here. After the top form completes, this
            area switches into an editable form so the user can confirm the result.
          </p>
        )}
      </section>

      {currentRun ? (
        <section style={styles.panel} data-testid="run-detail-panel">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Run Detail</p>
              <h2 style={styles.sectionTitle}>Current run data</h2>
            </div>
            <div style={styles.linkGroup}>
              <Link href="/" style={styles.link}>
                Back to home
              </Link>
              <Link
                href={`/runs/${currentRun.id}`}
                style={styles.link}
                data-testid="open-run-detail"
              >
                Open run detail
              </Link>
            </div>
          </div>
          <p style={styles.paragraph}>
            Current status: <strong>{currentRun.status}</strong>
            {currentRun.inputNotes
              ? ` | Notes: ${currentRun.inputNotes}`
              : " | No supporting notes"}
          </p>
          <DimensionSummary dimensions={currentRun.dimensions} />
        </section>
      ) : null}

      {currentRun ? (
        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Dimensions</p>
              <h2 style={styles.sectionTitle}>Editable dimension draft</h2>
            </div>
            <span style={styles.panelMeta}>
              {currentRun.status === "dimensions_ready"
                ? "dimensions_ready"
                : "draft editing"}
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
              <h2 style={styles.sectionTitle}>Explainable search draft</h2>
            </div>
            <span style={styles.panelMeta}>
              {currentRun.searchPlan?.status ?? "not generated"}
            </span>
          </div>
          <SearchPlanPanel
            key={`${currentRun.id}:${currentRun.updatedAt}:search-plan`}
            run={currentRun}
            onRunChanged={setCurrentRun}
          />
        </section>
      ) : null}

      <AnalysisPlaceholders statusLabel={currentRun?.status ?? "draft"} />
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
