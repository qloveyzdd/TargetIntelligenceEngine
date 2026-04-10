"use client";

import { useState, useTransition } from "react";
import type { AnalysisRun, Dimension } from "@/features/analysis-run/types";

type DimensionEditorProps = {
  run: AnalysisRun;
  onRunChanged: (run: AnalysisRun) => void;
};

function linesToArray(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasDynamicDimensions(dimensions: Dimension[]) {
  return dimensions.some((dimension) => dimension.layer !== "core");
}

function formatLayerLabel(layer: Dimension["layer"]) {
  switch (layer) {
    case "core":
      return "通用层";
    case "domain":
      return "领域层";
    case "project":
      return "项目层";
    default:
      return layer;
  }
}

function formatDirectionLabel(direction: Dimension["direction"]) {
  return direction === "higher_better" ? "越高越好" : "越低越好";
}

export function DimensionEditor({ run, onRunChanged }: DimensionEditorProps) {
  const [draft, setDraft] = useState(run.dimensions);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateDimension(
    dimensionId: string,
    updater: (dimension: Dimension) => Dimension
  ) {
    setDraft((current) =>
      current.map((dimension) =>
        dimension.id === dimensionId ? updater(dimension) : dimension
      )
    );
  }

  function generateDraft(forceRegenerate = false) {
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/runs/${run.id}/dimensions`, {
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
            setError(payload.error ?? "生成维度草稿失败。");
            return;
          }

          setDraft(payload.run.dimensions);
          onRunChanged(payload.run);
        } catch (generationError) {
          setError(
            generationError instanceof Error
              ? generationError.message
              : "生成维度草稿失败。"
          );
        }
      })();
    });
  }

  function saveDimensions() {
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/runs/${run.id}/dimensions`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              dimensions: draft
            })
          });
          const payload = (await response.json()) as {
            error?: string;
            run?: AnalysisRun;
          };

          if (!response.ok || !payload.run) {
            setError(payload.error ?? "保存维度失败。");
            return;
          }

          setDraft(payload.run.dimensions);
          onRunChanged(payload.run);
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : "保存维度失败。");
        }
      })();
    });
  }

  if (!run.goal) {
    return null;
  }

  if (!hasDynamicDimensions(draft)) {
    return (
      <div style={styles.emptyState} data-testid="dimension-editor-empty">
        <p style={styles.emptyText}>
          当前运行已经有 Phase 1 注入的 6 个核心维度。生成可编辑维度草稿后，才会补上领域层和项目层。
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => generateDraft(false)}
          disabled={isPending}
          data-testid="generate-dimension-draft"
        >
          {isPending ? "生成中..." : "生成维度草稿"}
        </button>
        {error ? <p style={styles.error}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={styles.wrapper} data-testid="dimension-editor">
      <div style={styles.toolbar}>
        <p style={styles.helper}>
          确认前可调整 `weight`、`direction`、`definition`、`evidenceNeeded` 和 `enabled`。
        </p>
        <div style={styles.actions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => generateDraft(true)}
            disabled={isPending}
            data-testid="regenerate-dimension-draft"
          >
            {isPending ? "刷新中..." : "重新生成草稿"}
          </button>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={saveDimensions}
            disabled={isPending}
            data-testid="save-dimensions"
          >
            {isPending ? "保存中..." : "保存维度"}
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {draft.map((dimension) => (
          <article
            key={dimension.id}
            style={styles.card}
            data-testid={`dimension-editor-card-${dimension.id}`}
          >
            <div style={styles.cardHeader}>
              <div>
                <strong>{dimension.name}</strong>
                <p style={styles.meta}>
                  层级：{formatLayerLabel(dimension.layer)} | 方向：{formatDirectionLabel(dimension.direction)}
                </p>
              </div>
              <label style={styles.toggle}>
                <input
                  type="checkbox"
                  checked={dimension.enabled}
                  onChange={(event) =>
                    updateDimension(dimension.id, (current) => ({
                      ...current,
                      enabled: event.target.checked
                    }))
                  }
                  data-testid={`dimension-enabled-${dimension.id}`}
                />
                启用
              </label>
            </div>

            <label style={styles.field}>
              <span style={styles.label}>权重</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={dimension.weight}
                onChange={(event) =>
                  updateDimension(dimension.id, (current) => ({
                    ...current,
                    weight: Number(event.target.value)
                  }))
                }
                style={styles.input}
                data-testid={`dimension-weight-${dimension.id}`}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>方向</span>
              <select
                value={dimension.direction}
                onChange={(event) =>
                  updateDimension(dimension.id, (current) => ({
                    ...current,
                    direction: event.target.value as Dimension["direction"]
                  }))
                }
                style={styles.input}
                data-testid={`dimension-direction-${dimension.id}`}
              >
                <option value="higher_better">越高越好</option>
                <option value="lower_better">越低越好</option>
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>定义</span>
              <textarea
                rows={3}
                value={dimension.definition}
                onChange={(event) =>
                  updateDimension(dimension.id, (current) => ({
                    ...current,
                    definition: event.target.value
                  }))
                }
                style={styles.textarea}
                data-testid={`dimension-definition-${dimension.id}`}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>所需证据</span>
              <textarea
                rows={3}
                value={dimension.evidenceNeeded.join("\n")}
                onChange={(event) =>
                  updateDimension(dimension.id, (current) => ({
                    ...current,
                    evidenceNeeded: linesToArray(event.target.value)
                  }))
                }
                style={styles.textarea}
                data-testid={`dimension-evidence-${dimension.id}`}
              />
            </label>
          </article>
        ))}
      </div>

      {error ? <p style={styles.error}>{error}</p> : null}
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
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px"
  },
  helper: {
    color: "var(--text-muted)",
    margin: 0
  },
  emptyState: {
    display: "grid",
    gap: "12px"
  },
  emptyText: {
    color: "var(--text-muted)",
    margin: 0
  },
  grid: {
    display: "grid",
    gap: "16px",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
  },
  card: {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    display: "grid",
    gap: "12px",
    padding: "16px"
  },
  cardHeader: {
    alignItems: "start",
    display: "flex",
    gap: "12px",
    justifyContent: "space-between"
  },
  meta: {
    color: "var(--text-muted)",
    fontSize: "13px",
    margin: "6px 0 0"
  },
  toggle: {
    alignItems: "center",
    display: "flex",
    gap: "8px"
  },
  field: {
    display: "grid",
    gap: "8px"
  },
  label: {
    fontSize: "13px",
    fontWeight: 600
  },
  input: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    minHeight: "42px",
    padding: "10px 12px"
  },
  textarea: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid var(--card-border)",
    borderRadius: "14px",
    padding: "10px 12px",
    resize: "vertical"
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
  },
  error: {
    color: "#b12424",
    margin: 0
  }
} satisfies Record<string, React.CSSProperties>;
