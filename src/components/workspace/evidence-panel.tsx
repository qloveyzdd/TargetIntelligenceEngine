"use client";

import type { CSSProperties } from "react";
import { useState, useTransition } from "react";
import type { AnalysisRun, Evidence } from "@/features/analysis-run/types";
import { ActionFeedback } from "./action-feedback";

type EvidencePanelProps = {
  run: AnalysisRun;
  onRunChanged: (run: AnalysisRun) => void;
};

function canShowEvidencePanel(status: AnalysisRun["status"]) {
  return status === "candidates_ready" || status === "evidence_ready";
}

function groupEvidence(evidence: Evidence[]) {
  const byCandidate = new Map<string, Map<string, Evidence[]>>();

  for (const item of evidence) {
    const candidateGroup = byCandidate.get(item.candidateId) ?? new Map<string, Evidence[]>();
    const dimensionGroup = candidateGroup.get(item.dimensionId) ?? [];

    dimensionGroup.push(item);
    candidateGroup.set(item.dimensionId, dimensionGroup);
    byCandidate.set(item.candidateId, candidateGroup);
  }

  return byCandidate;
}

export function EvidencePanel({ run, onRunChanged }: EvidencePanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"generate" | "regenerate" | null>(null);
  const [isPending, startTransition] = useTransition();
  const groupedEvidence = groupEvidence(run.evidence);
  const candidateNames = new Map(run.candidates.map((candidate) => [candidate.id, candidate.name]));
  const dimensionNames = new Map(run.dimensions.map((dimension) => [dimension.id, dimension.name]));

  function generateEvidence(forceRegenerate = false) {
    setError(null);
    setPendingAction(forceRegenerate ? "regenerate" : "generate");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/runs/${run.id}/evidence`, {
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
            setError(payload.error ?? "生成证据失败。");
            setPendingAction(null);
            return;
          }

          onRunChanged(payload.run);
        } catch (generationError) {
          setError(
            generationError instanceof Error
              ? generationError.message
              : "生成证据失败。"
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
                ? "正在重新生成证据，请稍候……"
                : "正在采集证据，请稍候……"
          }
        : run.evidence.length > 0
          ? {
              tone: "success" as const,
              message: "证据已生成，可继续进行评分。"
            }
          : {
              tone: "neutral" as const,
              message: "点击“生成证据”后，这里会显示采集进度和完成状态。"
            };

  if (run.candidates.length === 0) {
    return (
      <p style={styles.waiting}>
        证据面板要等候选存在且运行状态进入 `candidates_ready` 后才可用。
      </p>
    );
  }

  if (!canShowEvidencePanel(run.status)) {
    return (
      <p style={styles.waiting}>
        请先完成候选召回。只有运行状态变成 `candidates_ready` 后，才会开始采集证据。
      </p>
    );
  }

  if (run.evidence.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.waiting}>
          生成证据后，会为前 5 个深挖候选提取带来源的证据片段。
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => generateEvidence(false)}
          disabled={isPending}
          data-testid="generate-evidence"
        >
          {isPending ? "生成中..." : "生成证据"}
        </button>
        <ActionFeedback tone={feedback.tone} message={feedback.message} />
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="evidence-panel">
      <div style={styles.toolbar}>
        <p style={styles.waiting}>
          证据会按候选和维度分组，每条记录都保留来源链接和提取值。
        </p>
        <ActionFeedback tone={feedback.tone} message={feedback.message} />
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => generateEvidence(true)}
          disabled={isPending}
          data-testid="regenerate-evidence"
        >
          {isPending ? "刷新中..." : "重新生成证据"}
        </button>
      </div>

      <div style={styles.groups}>
        {Array.from(groupedEvidence.entries()).map(([candidateId, dimensions]) => (
          <section
            key={candidateId}
            style={styles.candidateGroup}
            data-testid="evidence-candidate-group"
          >
            <h3 style={styles.groupTitle}>
              {candidateNames.get(candidateId) ?? candidateId}
            </h3>
            <div style={styles.dimensionGroups}>
              {Array.from(dimensions.entries()).map(([dimensionId, records]) => (
                <article
                  key={`${candidateId}:${dimensionId}`}
                  style={styles.dimensionGroup}
                  data-testid="evidence-dimension-group"
                >
                  <strong>{dimensionNames.get(dimensionId) ?? dimensionId}</strong>
                  <div style={styles.records}>
                    {records.map((record, index) => (
                      <div
                        key={record.id ?? `${record.url}:${index}`}
                        style={styles.record}
                        data-testid="evidence-record"
                      >
                        <p style={styles.meta}>
                          {record.sourceType} | 置信度 {record.confidence.toFixed(2)}
                        </p>
                        <a
                          href={record.url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.link}
                        >
                          {record.url}
                        </a>
                        <p style={styles.body}>{record.excerpt}</p>
                        <p style={styles.meta}>提取值：{record.extractedValue}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
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
  groups: {
    display: "grid",
    gap: "16px"
  },
  candidateGroup: {
    background: "rgba(255,255,255,0.56)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "12px",
    padding: "16px"
  },
  groupTitle: {
    margin: 0
  },
  dimensionGroups: {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
  },
  dimensionGroup: {
    display: "grid",
    gap: "10px"
  },
  records: {
    display: "grid",
    gap: "10px"
  },
  record: {
    background: "rgba(255,255,255,0.8)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    display: "grid",
    gap: "6px",
    padding: "12px"
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
