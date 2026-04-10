import type {
  GraphFocus,
  RelationshipGraphModel,
  VisualTarget
} from "./relationship-graph-types";

type BuildGraphFocusInput = {
  graph: RelationshipGraphModel | null;
  target: VisualTarget | null;
};

function resolveNodeId(target: VisualTarget) {
  switch (target.type) {
    case "goal":
      return "goal";
    case "dimension":
      return `dimension:${target.dimensionId}`;
    case "candidate":
      return `candidate:${target.candidateId}`;
    case "gap":
      return `gap:${target.dimensionId}`;
    default:
      return null;
  }
}

export function buildGraphFocus(input: BuildGraphFocusInput): GraphFocus {
  if (!input.graph || !input.target) {
    return {
      target: input.target,
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      viewportNodeIds: []
    };
  }

  const target = input.target;

  if (target.type === "edge") {
    const edge = input.graph.edges.find((item) => item.id === target.edgeId);

    if (!edge) {
      return {
        target,
        highlightedNodeIds: [],
        highlightedEdgeIds: [],
        viewportNodeIds: []
      };
    }

    return {
      target,
      highlightedNodeIds: [edge.source, edge.target],
      highlightedEdgeIds: [edge.id],
      viewportNodeIds: [edge.source, edge.target]
    };
  }

  const nodeId = resolveNodeId(target);

  if (!nodeId) {
    return {
      target,
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      viewportNodeIds: []
    };
  }

  const connectedEdges = input.graph.edges.filter(
    (edge) => edge.source === nodeId || edge.target === nodeId
  );
  const connectedNodeIds = new Set<string>([nodeId]);

  for (const edge of connectedEdges) {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  }

  return {
    target,
    highlightedNodeIds: Array.from(connectedNodeIds),
    highlightedEdgeIds: connectedEdges.map((edge) => edge.id),
    viewportNodeIds: Array.from(connectedNodeIds)
  };
}
