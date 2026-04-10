import type { SearchPlanMode } from "@/features/analysis-run/types";

export type GraphNodeKind = "goal" | "dimension" | "candidate" | "gap";
export type GraphEdgeKind =
  | "goal_to_dimension"
  | "dimension_to_candidate"
  | "dimension_to_gap";

export type VisualTarget =
  | {
      type: "goal";
    }
  | {
      type: "dimension";
      dimensionId: string;
    }
  | {
      type: "candidate";
      candidateId: string;
    }
  | {
      type: "gap";
      dimensionId: string;
    }
  | {
      type: "edge";
      edgeId: string;
      relation: GraphEdgeKind;
      dimensionId?: string;
      candidateId?: string;
    };

export type RelationshipGraphNode = {
  id: string;
  kind: GraphNodeKind;
  label: string;
  summary: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  target: VisualTarget;
  meta?: {
    dimensionId?: string;
    candidateId?: string;
    overallScore?: number | null;
    priority?: number | null;
    coverage?: number;
    matchedModes?: SearchPlanMode[];
  };
};

export type RelationshipGraphEdge = {
  id: string;
  kind: GraphEdgeKind;
  source: string;
  target: string;
  label: string;
  summary: string;
  visualTarget: VisualTarget;
};

export type RelationshipGraphModel = {
  goalNodeId: string;
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphEdge[];
};

export type GraphFocus = {
  target: VisualTarget | null;
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  viewportNodeIds: string[];
};
