import { describe, expect, it } from "vitest";
import type { RelationshipGraphModel } from "./relationship-graph-types";
import { buildGraphFocus } from "./build-graph-focus";

const graph: RelationshipGraphModel = {
  goalNodeId: "goal",
  nodes: [
    {
      id: "goal",
      kind: "goal",
      label: "Goal",
      summary: "Goal",
      position: { x: 0, y: 0 },
      width: 10,
      height: 10,
      target: { type: "goal" }
    },
    {
      id: "dimension:cost",
      kind: "dimension",
      label: "Cost",
      summary: "Cost",
      position: { x: 10, y: 0 },
      width: 10,
      height: 10,
      target: { type: "dimension", dimensionId: "cost" }
    },
    {
      id: "candidate:prod-a",
      kind: "candidate",
      label: "Product A",
      summary: "Candidate",
      position: { x: 20, y: 0 },
      width: 10,
      height: 10,
      target: { type: "candidate", candidateId: "prod-a" }
    },
    {
      id: "gap:cost",
      kind: "gap",
      label: "Cost gap",
      summary: "Gap",
      position: { x: 20, y: 10 },
      width: 10,
      height: 10,
      target: { type: "gap", dimensionId: "cost" }
    }
  ],
  edges: [
    {
      id: "goal_to_dimension:goal:dimension:cost",
      kind: "goal_to_dimension",
      source: "goal",
      target: "dimension:cost",
      label: "Active",
      summary: "Goal to dimension",
      visualTarget: {
        type: "edge",
        edgeId: "goal_to_dimension:goal:dimension:cost",
        relation: "goal_to_dimension",
        dimensionId: "cost"
      }
    },
    {
      id: "dimension_to_candidate:dimension:cost:candidate:prod-a",
      kind: "dimension_to_candidate",
      source: "dimension:cost",
      target: "candidate:prod-a",
      label: "82 score",
      summary: "Dimension to candidate",
      visualTarget: {
        type: "edge",
        edgeId: "dimension_to_candidate:dimension:cost:candidate:prod-a",
        relation: "dimension_to_candidate",
        dimensionId: "cost",
        candidateId: "prod-a"
      }
    },
    {
      id: "dimension_to_gap:dimension:cost:gap:cost",
      kind: "dimension_to_gap",
      source: "dimension:cost",
      target: "gap:cost",
      label: "Priority 3.5",
      summary: "Dimension to gap",
      visualTarget: {
        type: "edge",
        edgeId: "dimension_to_gap:dimension:cost:gap:cost",
        relation: "dimension_to_gap",
        dimensionId: "cost"
      }
    }
  ]
};

describe("buildGraphFocus", () => {
  it("highlights the connected subgraph for a dimension node", () => {
    const focus = buildGraphFocus({
      graph,
      target: {
        type: "dimension",
        dimensionId: "cost"
      }
    });

    expect(focus.highlightedNodeIds).toEqual([
      "dimension:cost",
      "goal",
      "candidate:prod-a",
      "gap:cost"
    ]);
    expect(focus.highlightedEdgeIds).toHaveLength(3);
  });

  it("highlights the connected path for a candidate node", () => {
    const focus = buildGraphFocus({
      graph,
      target: {
        type: "candidate",
        candidateId: "prod-a"
      }
    });

    expect(focus.highlightedNodeIds).toEqual(["candidate:prod-a", "dimension:cost"]);
    expect(focus.highlightedEdgeIds).toEqual([
      "dimension_to_candidate:dimension:cost:candidate:prod-a"
    ]);
  });

  it("highlights the selected edge and both endpoints", () => {
    const focus = buildGraphFocus({
      graph,
      target: {
        type: "edge",
        edgeId: "dimension_to_gap:dimension:cost:gap:cost",
        relation: "dimension_to_gap",
        dimensionId: "cost"
      }
    });

    expect(focus.highlightedNodeIds).toEqual(["dimension:cost", "gap:cost"]);
    expect(focus.highlightedEdgeIds).toEqual(["dimension_to_gap:dimension:cost:gap:cost"]);
  });
});
