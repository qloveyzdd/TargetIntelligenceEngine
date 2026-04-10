"use client";

import type { CSSProperties } from "react";
import { useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node
} from "@xyflow/react";
import type {
  GraphFocus,
  RelationshipGraphModel,
  VisualTarget
} from "@/features/visuals/relationship-graph-types";

type RelationshipGraphProps = {
  graph: RelationshipGraphModel;
  focus: GraphFocus;
  onSelectTarget: (target: VisualTarget) => void;
};

type FlowNodeData = {
  label: string;
  summary: string;
  target: VisualTarget;
  kind: string;
};

type FlowEdgeData = {
  visualTarget: VisualTarget;
};

export function RelationshipGraph({
  graph,
  focus,
  onSelectTarget
}: RelationshipGraphProps) {
  const flowNodes = useMemo<Array<Node<FlowNodeData>>>(() => {
    const highlightedNodeIds = new Set(focus.highlightedNodeIds);

    return graph.nodes.map((node) => ({
      id: node.id,
      position: node.position,
      data: {
        label: node.label,
        summary: node.summary,
        target: node.target,
        kind: node.kind
      },
      draggable: false,
      selectable: true,
      style: {
        background: highlightedNodeIds.has(node.id)
          ? "rgba(178, 92, 52, 0.14)"
          : "rgba(255,255,255,0.92)",
        border: highlightedNodeIds.has(node.id)
          ? "1px solid var(--accent)"
          : "1px solid var(--card-border)",
        borderRadius: "16px",
        boxShadow: highlightedNodeIds.has(node.id)
          ? "0 10px 24px rgba(178, 92, 52, 0.16)"
          : "0 8px 18px rgba(92, 64, 51, 0.08)",
        color: "var(--text-main)",
        fontSize: "13px",
        padding: "12px",
        width: node.width
      }
    }));
  }, [focus.highlightedNodeIds, graph.nodes]);

  const flowEdges = useMemo<Array<Edge<FlowEdgeData>>>(() => {
    const highlightedEdgeIds = new Set(focus.highlightedEdgeIds);

    return graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      data: {
        visualTarget: edge.visualTarget
      },
      selectable: true,
      animated: highlightedEdgeIds.has(edge.id),
      style: {
        stroke: highlightedEdgeIds.has(edge.id) ? "var(--accent)" : "#8e7c73",
        strokeWidth: highlightedEdgeIds.has(edge.id) ? 2.5 : 1.4
      },
      labelStyle: {
        fill: "var(--text-main)",
        fontSize: 12,
        fontWeight: 600
      },
      labelBgStyle: {
        fill: "rgba(255,255,255,0.88)",
        fillOpacity: 1
      }
    }));
  }, [focus.highlightedEdgeIds, graph.edges]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvas} data-testid="relationship-graph">
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            fitView
            minZoom={0.5}
            maxZoom={1.4}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnDrag
            onNodeClick={(_, node) => {
              onSelectTarget(node.data.target);
            }}
            onEdgeClick={(_, edge) => {
              onSelectTarget(edge.data?.visualTarget ?? { type: "goal" });
            }}
            proOptions={{
              hideAttribution: true
            }}
          >
            <Background color="rgba(92,64,51,0.12)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      <div style={styles.edgeList}>
        {graph.edges.map((edge) => {
          const isActive = focus.highlightedEdgeIds.includes(edge.id);

          return (
            <button
              key={edge.id}
              type="button"
              style={{
                ...styles.edgeButton,
                ...(isActive ? styles.edgeButtonActive : {})
              }}
              data-testid="graph-edge-button"
              onClick={() => onSelectTarget(edge.visualTarget)}
            >
              {edge.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gap: "14px"
  },
  canvas: {
    background: "rgba(255,255,255,0.82)",
    border: "1px solid var(--card-border)",
    borderRadius: "18px",
    height: "420px",
    overflow: "hidden",
    width: "100%"
  } satisfies CSSProperties,
  edgeList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  } satisfies CSSProperties,
  edgeButton: {
    background: "rgba(255,255,255,0.82)",
    borderColor: "var(--card-border)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderRadius: "999px",
    color: "var(--text-main)",
    cursor: "pointer",
    padding: "8px 12px"
  } satisfies CSSProperties,
  edgeButtonActive: {
    background: "var(--accent-soft)",
    borderColor: "var(--accent)",
    color: "var(--accent)"
  } satisfies CSSProperties
};
