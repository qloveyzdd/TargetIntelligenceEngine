"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import type { RadarChartModel } from "@/features/visuals/radar-types";
import type { VisualTarget } from "@/features/visuals/relationship-graph-types";

type RadarChartProps = {
  model: RadarChartModel;
  activeTarget: VisualTarget | null;
  onSelectTarget: (target: VisualTarget) => void;
};

type RadarChartInstance = {
  setOption: (option: unknown, notMerge?: boolean) => void;
  on: (eventName: string, handler: (payload: { seriesId?: string }) => void) => void;
  off: (eventName: string, handler: (payload: { seriesId?: string }) => void) => void;
  resize: () => void;
  dispose: () => void;
};

type RadarChartModule = {
  init: (element: HTMLElement) => RadarChartInstance;
};

type ResizeObserverLike = {
  observe: (element: Element, options?: unknown) => void;
  disconnect: () => void;
};

type ResizeObserverLikeCtor = new (
  callback: (...args: unknown[]) => void
) => ResizeObserverLike;

export function buildRadarChartOption(
  model: RadarChartModel,
  activeTarget: VisualTarget | null
) {
  return {
    animation: false,
    color: ["#6f5a4f", "#b25c34", "#3c7a63", "#476f95", "#936042"],
    legend: {
      show: false
    },
    radar: {
      indicator: model.axes.map((axis) => ({
        name: axis.label,
        max: axis.max
      })),
      radius: "64%",
      splitArea: {
        areaStyle: {
          color: ["rgba(255,255,255,0.8)", "rgba(178,92,52,0.04)"]
        }
      },
      splitLine: {
        lineStyle: {
          color: "rgba(92,64,51,0.16)"
        }
      },
      axisName: {
        color: "#2f241f"
      }
    },
    series: [
      {
        type: "radar",
        data: model.series.map((series) => {
          const isActive =
            (series.kind === "goal" && activeTarget?.type === "goal") ||
            (series.kind === "candidate" &&
              activeTarget?.type === "candidate" &&
              activeTarget.candidateId === series.candidateId);

          return {
            id: series.id,
            name: series.label,
            value: series.values.map((value) => value.value ?? Number.NaN),
            lineStyle: {
              type: series.kind === "goal" ? "dashed" : "solid",
              width: isActive ? 3 : 2
            },
            areaStyle: {
              opacity: series.kind === "goal" ? 0.08 : isActive ? 0.24 : 0.16
            },
            symbolSize: isActive ? 7 : 5
          };
        })
      }
    ]
  };
}

export function mountRadarChart(input: {
  element: HTMLElement;
  model: RadarChartModel;
  activeTarget: VisualTarget | null;
  onSelectTarget: (target: VisualTarget) => void;
  chartModule: RadarChartModule;
  ResizeObserverCtor?: ResizeObserverLikeCtor;
}) {
  const chart = input.chartModule.init(input.element);
  const clickHandler = (payload: { seriesId?: string }) => {
    if (!payload.seriesId) {
      return;
    }

    if (payload.seriesId === "goal") {
      input.onSelectTarget({
        type: "goal"
      });

      return;
    }

    if (payload.seriesId.startsWith("candidate:")) {
      input.onSelectTarget({
        type: "candidate",
        candidateId: payload.seriesId.replace("candidate:", "")
      });
    }
  };

  chart.on("click", clickHandler);
  chart.setOption(buildRadarChartOption(input.model, input.activeTarget), true);

  let resizeObserver: ResizeObserverLike | null = null;

  if (input.ResizeObserverCtor) {
    resizeObserver = new input.ResizeObserverCtor(() => {
      chart.resize();
    });
    resizeObserver.observe(input.element);
  }

  return {
    update(nextModel: RadarChartModel, nextTarget: VisualTarget | null) {
      chart.setOption(buildRadarChartOption(nextModel, nextTarget), true);
    },
    dispose() {
      resizeObserver?.disconnect();
      chart.off("click", clickHandler);
      chart.dispose();
    }
  };
}

export function RadarChart({
  model,
  activeTarget,
  onSelectTarget
}: RadarChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartBindingRef = useRef<ReturnType<typeof mountRadarChart> | null>(null);
  const latestModelRef = useRef(model);
  const latestTargetRef = useRef(activeTarget);

  latestModelRef.current = model;
  latestTargetRef.current = activeTarget;

  useEffect(() => {
    let cancelled = false;

    void import("echarts").then((chartModule) => {
      if (cancelled || !containerRef.current || chartBindingRef.current) {
        return;
      }

      chartBindingRef.current = mountRadarChart({
        element: containerRef.current,
        model: latestModelRef.current,
        activeTarget: latestTargetRef.current,
        onSelectTarget,
        chartModule: chartModule as unknown as RadarChartModule,
        ResizeObserverCtor:
          typeof window !== "undefined"
            ? (window.ResizeObserver as unknown as ResizeObserverLikeCtor)
            : undefined
      });
    });

    return () => {
      cancelled = true;
      chartBindingRef.current?.dispose();
      chartBindingRef.current = null;
    };
  }, [onSelectTarget]);

  useEffect(() => {
    chartBindingRef.current?.update(model, activeTarget);
  }, [activeTarget, model]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.legend} data-testid="radar-series-list">
        {model.series.map((series) => {
          const isActive =
            (series.kind === "goal" && activeTarget?.type === "goal") ||
            (series.kind === "candidate" &&
              activeTarget?.type === "candidate" &&
              activeTarget.candidateId === series.candidateId);

          return (
            <button
              key={series.id}
              type="button"
              style={{
                ...styles.seriesButton,
                ...(isActive ? styles.seriesButtonActive : {})
              }}
              data-testid="radar-series-button"
              onClick={() =>
                onSelectTarget(
                  series.kind === "goal"
                    ? {
                        type: "goal"
                      }
                    : {
                        type: "candidate",
                        candidateId: series.candidateId ?? ""
                      }
                )
              }
            >
              {series.label}
            </button>
          );
        })}
      </div>
      <div ref={containerRef} style={styles.chart} data-testid="radar-chart" />
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "14px"
  } satisfies CSSProperties,
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  } satisfies CSSProperties,
  seriesButton: {
    background: "rgba(255,255,255,0.82)",
    borderColor: "var(--card-border)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: "999px",
    color: "var(--text-main)",
    cursor: "pointer",
    padding: "8px 12px"
  } satisfies CSSProperties,
  seriesButtonActive: {
    background: "var(--accent-soft)",
    borderColor: "var(--accent)",
    color: "var(--accent)"
  } satisfies CSSProperties,
  chart: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    height: "360px",
    minHeight: "360px",
    width: "100%"
  } satisfies CSSProperties
};
