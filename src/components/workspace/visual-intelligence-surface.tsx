"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { AnalysisRun } from "@/features/analysis-run/types";
import {
  buildVisualExplanation,
  type VisualExplanation
} from "@/features/visuals/build-visual-explanation";
import { buildGraphFocus } from "@/features/visuals/build-graph-focus";
import { buildRadarChartModel } from "@/features/visuals/build-radar-chart-model";
import { buildRelationshipGraph } from "@/features/visuals/build-relationship-graph";
import type { VisualTarget } from "@/features/visuals/relationship-graph-types";
import { selectRadarCandidates } from "@/features/visuals/select-radar-candidates";

const RadarChart = dynamic(
  () => import("./radar-chart").then((module) => module.RadarChart),
  {
    ssr: false,
    loading: () => (
      <div style={styles.chartFallback} data-testid="radar-chart">
        Loading radar chart...
      </div>
    )
  }
);

const RelationshipGraph = dynamic(
  () => import("./relationship-graph").then((module) => module.RelationshipGraph),
  {
    ssr: false,
    loading: () => (
      <div style={styles.chartFallback} data-testid="relationship-graph">
        Loading relationship graph...
      </div>
    )
  }
);

type VisualIntelligenceSurfaceProps = {
  run: AnalysisRun;
};

function ExplanationPanel({ explanation }: { explanation: VisualExplanation | null }) {
  if (!explanation) {
    return (
      <div style={styles.explanationEmpty} data-testid="visual-explanation-panel">
        Select a chart object to inspect its explanation.
      </div>
    );
  }

  return (
    <div style={styles.explanationPanel} data-testid="visual-explanation-panel">
      <div style={styles.explanationHeader}>
        <p style={styles.sectionEyebrow}>Explanation</p>
        <h3 style={styles.explanationTitle}>{explanation.title}</h3>
        <p style={styles.explanationSubtitle}>{explanation.subtitle}</p>
        <p style={styles.explanationSummary}>{explanation.summary}</p>
      </div>

      <div style={styles.metricList}>
        {explanation.metrics.map((metric) => (
          <div key={metric.label} style={styles.metricCard}>
            <span style={styles.metricLabel}>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div style={styles.relatedList}>
        {explanation.related.map((item) => (
          <div key={item.label} style={styles.relatedItem}>
            <span style={styles.relatedLabel}>{item.label}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={styles.evidenceSection}>
        <p style={styles.sectionEyebrow}>Evidence</p>
        {explanation.evidence.length === 0 ? (
          <p style={styles.explanationSubtitle}>No evidence rows are attached to this target.</p>
        ) : (
          <div style={styles.evidenceList}>
            {explanation.evidence.map((record) => (
              <article key={record.id} style={styles.evidenceCard} data-testid="visual-evidence">
                <div style={styles.relatedItem}>
                  <strong>{record.id}</strong>
                  <span>{record.sourceType}</span>
                </div>
                <p style={styles.explanationSubtitle}>{record.excerpt}</p>
                <p style={styles.explanationSubtitle}>
                  {record.extractedValue} | confidence {record.confidenceLabel}
                </p>
                <a href={record.url} target="_blank" rel="noreferrer" style={styles.link}>
                  Open source
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VisualIntelligenceSurface({
  run
}: VisualIntelligenceSurfaceProps) {
  const initialSelection = useMemo(
    () =>
      selectRadarCandidates({
        candidates: run.candidates,
        scoring: run.scoring,
        selectedCandidateIds: undefined
      }).selectedCandidateIds,
    [run.candidates, run.scoring]
  );
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(initialSelection);
  const [selectedTarget, setSelectedTarget] = useState<VisualTarget>({
    type: "goal"
  });

  const radarModel = useMemo(
    () =>
      buildRadarChartModel({
        run,
        selectedCandidateIds
      }),
    [run, selectedCandidateIds]
  );
  const graphModel = useMemo(
    () =>
      buildRelationshipGraph({
        run
      }),
    [run]
  );
  const graphFocus = useMemo(
    () =>
      buildGraphFocus({
        graph: graphModel,
        target: selectedTarget
      }),
    [graphModel, selectedTarget]
  );
  const explanation = useMemo(
    () =>
      buildVisualExplanation({
        run,
        target: selectedTarget
      }),
    [run, selectedTarget]
  );

  if (!run.scoring || !radarModel || !graphModel) {
    return null;
  }

  return (
    <div style={styles.wrapper} data-testid="visual-intelligence-surface">
      <div style={styles.leftColumn}>
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Radar</p>
              <h2 style={styles.sectionTitle}>Radar comparison</h2>
            </div>
            <span style={styles.panelMeta}>
              Goal + {radarModel.selection.selectedCandidateIds.length} candidates
            </span>
          </div>

          <div style={styles.toggleList}>
            {radarModel.selection.availableCandidateIds.map((candidateId) => {
              const candidate = run.candidates.find((item) => item.id === candidateId);
              const checked = radarModel.selection.selectedCandidateIds.includes(candidateId);

              return (
                <label key={candidateId} style={styles.toggleItem}>
                  <input
                    type="checkbox"
                    checked={checked}
                    data-testid="radar-candidate-toggle"
                    onChange={() => {
                      const requestedCandidateIds = checked
                        ? selectedCandidateIds.filter((item) => item !== candidateId)
                        : [...selectedCandidateIds, candidateId];
                      const nextSelection = selectRadarCandidates({
                        candidates: run.candidates,
                        scoring: run.scoring,
                        selectedCandidateIds: requestedCandidateIds
                      });

                      setSelectedCandidateIds(nextSelection.selectedCandidateIds);
                    }}
                  />
                  <span>{candidate?.name ?? candidateId}</span>
                </label>
              );
            })}
          </div>

          <RadarChart
            model={radarModel}
            activeTarget={selectedTarget}
            onSelectTarget={setSelectedTarget}
          />
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Graph</p>
              <h2 style={styles.sectionTitle}>Relationship map</h2>
            </div>
            <span style={styles.panelMeta}>{graphModel.nodes.length} nodes</span>
          </div>

          <RelationshipGraph
            graph={graphModel}
            focus={graphFocus}
            onSelectTarget={setSelectedTarget}
          />
        </section>
      </div>

      <aside style={styles.rightColumn}>
        <ExplanationPanel explanation={explanation} />
      </aside>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "20px",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)"
  } satisfies CSSProperties,
  leftColumn: {
    display: "grid",
    gap: "20px"
  },
  rightColumn: {
    minWidth: 0
  },
  card: {
    background: "rgba(255,255,255,0.56)",
    border: "1px solid var(--card-border)",
    borderRadius: "24px",
    boxShadow: "var(--panel-shadow)",
    display: "grid",
    gap: "16px",
    padding: "18px"
  } satisfies CSSProperties,
  sectionHeader: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    justifyContent: "space-between"
  } satisfies CSSProperties,
  sectionEyebrow: {
    color: "var(--accent)",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase"
  },
  sectionTitle: {
    margin: "4px 0 0"
  },
  panelMeta: {
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: 600
  },
  toggleList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px"
  } satisfies CSSProperties,
  toggleItem: {
    alignItems: "center",
    display: "flex",
    gap: "8px"
  } satisfies CSSProperties,
  explanationPanel: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid var(--card-border)",
    borderRadius: "24px",
    display: "grid",
    gap: "16px",
    minHeight: "100%",
    padding: "18px",
    position: "sticky",
    top: "16px"
  } satisfies CSSProperties,
  explanationEmpty: {
    background: "rgba(255,255,255,0.82)",
    border: "1px dashed var(--card-border)",
    borderRadius: "24px",
    color: "var(--text-muted)",
    padding: "18px"
  } satisfies CSSProperties,
  explanationHeader: {
    display: "grid",
    gap: "8px"
  },
  explanationTitle: {
    margin: 0
  },
  explanationSubtitle: {
    color: "var(--text-muted)",
    lineHeight: 1.6,
    margin: 0
  },
  explanationSummary: {
    lineHeight: 1.7,
    margin: 0
  },
  metricList: {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))"
  },
  metricCard: {
    background: "rgba(255,255,255,0.76)",
    border: "1px solid var(--card-border)",
    borderRadius: "16px",
    display: "grid",
    gap: "6px",
    padding: "12px"
  } satisfies CSSProperties,
  metricLabel: {
    color: "var(--text-muted)",
    fontSize: "12px"
  },
  relatedList: {
    display: "grid",
    gap: "8px"
  },
  relatedItem: {
    alignItems: "center",
    display: "flex",
    gap: "8px",
    justifyContent: "space-between"
  } satisfies CSSProperties,
  relatedLabel: {
    color: "var(--text-muted)",
    fontSize: "13px"
  },
  evidenceSection: {
    display: "grid",
    gap: "12px"
  },
  evidenceList: {
    display: "grid",
    gap: "10px"
  },
  evidenceCard: {
    background: "rgba(255,255,255,0.76)",
    border: "1px solid var(--card-border)",
    borderRadius: "16px",
    display: "grid",
    gap: "8px",
    padding: "12px"
  } satisfies CSSProperties,
  link: {
    color: "var(--accent)",
    fontWeight: 600
  },
  chartFallback: {
    alignItems: "center",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    color: "var(--text-muted)",
    display: "flex",
    height: "360px",
    justifyContent: "center"
  } satisfies CSSProperties
};
