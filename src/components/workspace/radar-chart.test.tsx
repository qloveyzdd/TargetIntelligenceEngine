import { describe, expect, it, vi } from "vitest";
import type { RadarChartModel } from "@/features/visuals/radar-types";
import { buildRadarChartOption, mountRadarChart } from "./radar-chart";

function createModel(): RadarChartModel {
  return {
    goalLabel: "Target Intelligence Engine",
    axes: [
      {
        dimensionId: "cost",
        label: "Cost",
        definition: "Cost profile.",
        direction: "lower_better",
        weight: 0.4,
        max: 100
      },
      {
        dimensionId: "ecosystem",
        label: "Ecosystem",
        definition: "Ecosystem profile.",
        direction: "higher_better",
        weight: 0.6,
        max: 100
      }
    ],
    series: [
      {
        id: "goal",
        label: "Target Intelligence Engine",
        kind: "goal",
        candidateId: null,
        overallScore: 100,
        coverage: 1,
        unknownCount: 0,
        matchedModes: [],
        values: [
          {
            dimensionId: "cost",
            label: "Cost",
            status: "known",
            value: 100,
            coverage: 1,
            evidenceIds: [],
            summary: "Goal cost."
          },
          {
            dimensionId: "ecosystem",
            label: "Ecosystem",
            status: "known",
            value: 100,
            coverage: 1,
            evidenceIds: [],
            summary: "Goal ecosystem."
          }
        ]
      },
      {
        id: "candidate:prod-a",
        label: "Product A",
        kind: "candidate",
        candidateId: "prod-a",
        overallScore: 84,
        coverage: 1,
        unknownCount: 0,
        matchedModes: ["same_goal"],
        values: [
          {
            dimensionId: "cost",
            label: "Cost",
            status: "known",
            value: 84,
            coverage: 1,
            evidenceIds: ["e-cost-1"],
            summary: "Candidate cost."
          },
          {
            dimensionId: "ecosystem",
            label: "Ecosystem",
            status: "unknown",
            value: null,
            coverage: 0,
            evidenceIds: ["e-eco-1"],
            summary: "Unknown ecosystem score."
          }
        ]
      }
    ],
    selection: {
      availableCandidateIds: ["prod-a"],
      defaultCandidateIds: ["prod-a"],
      selectedCandidateIds: ["prod-a"]
    }
  };
}

describe("radar-chart", () => {
  it("keeps unknown values as NaN in the ECharts option instead of zero", () => {
    const option = buildRadarChartOption(createModel(), {
      type: "candidate",
      candidateId: "prod-a"
    }) as {
      series: Array<{
        data: Array<{
          value: number[];
        }>;
      }>;
    };

    expect(option.series[0]?.data[1]?.value[1]).toBeNaN();
  });

  it("initializes, updates, resizes, and disposes the chart instance", () => {
    const setOption = vi.fn();
    const on = vi.fn();
    const off = vi.fn();
    const resize = vi.fn();
    const dispose = vi.fn();
    const module = {
      init: vi.fn(() => ({
        setOption,
        on: vi.fn((eventName: string, handler: (payload: { seriesId?: string }) => void) => {
          on(eventName, handler);
        }),
        off,
        resize,
        dispose
      }))
    };
    const observe = vi.fn();
    const disconnect = vi.fn();
    const onSelectTarget = vi.fn();

    class ResizeObserverMock {
      constructor(private readonly callback: () => void) {}

      observe(element: Element) {
        observe(element);
        this.callback();
      }

      disconnect() {
        disconnect();
      }
    }

    const binding = mountRadarChart({
      element: {
        id: "chart"
      } as HTMLElement,
      model: createModel(),
      activeTarget: {
        type: "goal"
      },
      onSelectTarget,
      chartModule: module,
      ResizeObserverCtor: ResizeObserverMock
    });

    binding.update(createModel(), {
      type: "candidate",
      candidateId: "prod-a"
    });

    const handler = on.mock.calls[0]?.[1] as
      | ((payload: { seriesId?: string }) => void)
      | undefined;

    if (!handler) {
      throw new Error("Expected click handler to be registered.");
    }

    handler({
      seriesId: "candidate:prod-a"
    });
    binding.dispose();

    expect(module.init).toHaveBeenCalledTimes(1);
    expect(setOption).toHaveBeenCalledTimes(2);
    expect(resize).toHaveBeenCalledTimes(1);
    expect(onSelectTarget).toHaveBeenCalledWith({
      type: "candidate",
      candidateId: "prod-a"
    });
    expect(off).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
