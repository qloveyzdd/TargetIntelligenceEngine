import dagre from "@dagrejs/dagre";
import type {
  AnalysisRun,
  Candidate,
  CandidateScorecard,
  GapPriority
} from "@/features/analysis-run/types";
import type {
  GraphEdgeKind,
  RelationshipGraphEdge,
  RelationshipGraphModel,
  RelationshipGraphNode
} from "./relationship-graph-types";

type BuildRelationshipGraphInput = {
  run: AnalysisRun;
};

const GOAL_NODE_ID = "goal";

const NODE_SIZE_BY_KIND: Record<RelationshipGraphNode["kind"], { width: number; height: number }> =
  {
    goal: { width: 220, height: 112 },
    dimension: { width: 220, height: 120 },
    candidate: { width: 220, height: 132 },
    gap: { width: 220, height: 120 }
  };

function round(value: number) {
  return Number(value.toFixed(1));
}

function getCandidateOrder(run: AnalysisRun) {
  if (!run.scoring) {
    return [];
  }

  const scorecardsByCandidateId = new Map(
    run.scoring.candidateScorecards.map((scorecard) => [scorecard.candidateId, scorecard])
  );

  return run.candidates
    .filter((candidate) => scorecardsByCandidateId.has(candidate.id))
    .slice()
    .sort((left, right) => {
      const leftScore = scorecardsByCandidateId.get(left.id)?.overallScore ?? -1;
      const rightScore = scorecardsByCandidateId.get(right.id)?.overallScore ?? -1;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      if (left.recallRank !== right.recallRank) {
        return left.recallRank - right.recallRank;
      }

      return left.name.localeCompare(right.name);
    });
}

function getNodeSize(kind: RelationshipGraphNode["kind"]) {
  return NODE_SIZE_BY_KIND[kind];
}

function createGoalNode(run: AnalysisRun): RelationshipGraphNode {
  const size = getNodeSize("goal");

  return {
    id: GOAL_NODE_ID,
    kind: "goal",
    label: run.goal?.name ?? "当前目标",
    summary: run.goal?.jobToBeDone ?? "当前分析运行的目标概览。",
    position: { x: 0, y: 0 },
    width: size.width,
    height: size.height,
    target: { type: "goal" }
  };
}

function buildCandidateNode(
  candidate: Candidate,
  scorecard: CandidateScorecard
): RelationshipGraphNode {
  const size = getNodeSize("candidate");

  return {
    id: `candidate:${candidate.id}`,
    kind: "candidate",
    label: candidate.name,
    summary:
      scorecard.overallScore === null
        ? "暂时还没有总分。"
        : `总分 ${scorecard.overallScore.toFixed(1)}，覆盖率 ${Math.round(
            scorecard.coverage * 100
          )}%。`,
    position: { x: 0, y: 0 },
    width: size.width,
    height: size.height,
    target: {
      type: "candidate",
      candidateId: candidate.id
    },
    meta: {
      candidateId: candidate.id,
      overallScore: scorecard.overallScore,
      coverage: scorecard.coverage,
      matchedModes: candidate.matchedModes
    }
  };
}

function buildGapNode(gap: GapPriority, dimensionName: string): RelationshipGraphNode {
  const size = getNodeSize("gap");

  return {
    id: `gap:${gap.dimensionId}`,
    kind: "gap",
    label: `${dimensionName} 差距`,
    summary: gap.summary,
    position: { x: 0, y: 0 },
    width: size.width,
    height: size.height,
    target: {
      type: "gap",
      dimensionId: gap.dimensionId
    },
    meta: {
      dimensionId: gap.dimensionId,
      priority: gap.priority
    }
  };
}

function createEdge(input: {
  kind: GraphEdgeKind;
  source: string;
  target: string;
  label: string;
  summary: string;
  dimensionId?: string;
  candidateId?: string;
}): RelationshipGraphEdge {
  const edgeId = `${input.kind}:${input.source}:${input.target}`;

  return {
    id: edgeId,
    kind: input.kind,
    source: input.source,
    target: input.target,
    label: input.label,
    summary: input.summary,
    visualTarget: {
      type: "edge",
      edgeId,
      relation: input.kind,
      dimensionId: input.dimensionId,
      candidateId: input.candidateId
    }
  };
}

function applyLayout(model: RelationshipGraphModel) {
  const graph = new dagre.graphlib.Graph();

  graph.setGraph({
    rankdir: "LR",
    ranksep: 120,
    nodesep: 48,
    marginx: 16,
    marginy: 16
  });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const node of model.nodes) {
    graph.setNode(node.id, {
      width: node.width,
      height: node.height
    });
  }

  for (const edge of model.edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return {
    ...model,
    nodes: model.nodes.map((node) => {
      const layoutNode = graph.node(node.id);

      return {
        ...node,
        position: {
          x: round(layoutNode.x - node.width / 2),
          y: round(layoutNode.y - node.height / 2)
        }
      };
    })
  };
}

export function buildRelationshipGraph(
  input: BuildRelationshipGraphInput
): RelationshipGraphModel | null {
  const { run } = input;

  if (!run.scoring) {
    return null;
  }

  const enabledDimensions = run.dimensions.filter((dimension) => dimension.enabled);

  if (enabledDimensions.length === 0) {
    return null;
  }

  const scorecardsByCandidateId = new Map(
    run.scoring.candidateScorecards.map((scorecard) => [scorecard.candidateId, scorecard])
  );
  const goalNode = createGoalNode(run);
  const nodes: RelationshipGraphNode[] = [goalNode];
  const edges: RelationshipGraphEdge[] = [];
  const candidateOrder = getCandidateOrder(run);
  const candidateNodes = new Map<string, RelationshipGraphNode>();

  for (const dimension of enabledDimensions) {
    const size = getNodeSize("dimension");
    const dimensionNode: RelationshipGraphNode = {
      id: `dimension:${dimension.id}`,
      kind: "dimension",
      label: dimension.name,
      summary: dimension.definition,
      position: { x: 0, y: 0 },
      width: size.width,
      height: size.height,
      target: {
        type: "dimension",
        dimensionId: dimension.id
      },
      meta: {
        dimensionId: dimension.id
      }
    };

    nodes.push(dimensionNode);
    edges.push(
      createEdge({
        kind: "goal_to_dimension",
        source: goalNode.id,
        target: dimensionNode.id,
        label: "激活维度",
        summary: `${dimension.name} 当前已被纳入目标分析。`,
        dimensionId: dimension.id
      })
    );

    for (const candidate of candidateOrder) {
      const scorecard = scorecardsByCandidateId.get(candidate.id);
      const dimensionScorecard = scorecard?.dimensionScorecards.find(
        (item) => item.dimensionId === dimension.id
      );

      if (
        !scorecard ||
        !dimensionScorecard ||
        dimensionScorecard.status !== "known" ||
        dimensionScorecard.score === null
      ) {
        continue;
      }

      if (!candidateNodes.has(candidate.id)) {
        const candidateNode = buildCandidateNode(candidate, scorecard);

        candidateNodes.set(candidate.id, candidateNode);
        nodes.push(candidateNode);
      }

      edges.push(
        createEdge({
          kind: "dimension_to_candidate",
          source: dimensionNode.id,
          target: `candidate:${candidate.id}`,
          label: `${dimensionScorecard.score.toFixed(1)} 分`,
          summary: `${candidate.name} 在 ${dimension.name} 上有 ${dimensionScorecard.score.toFixed(
            1
          )} 分的证据支撑得分。`,
          dimensionId: dimension.id,
          candidateId: candidate.id
        })
      );
    }

    const gap = run.scoring.gaps.find(
      (item) =>
        item.dimensionId === dimension.id &&
        item.status === "known" &&
        item.priority !== null
    );

    if (!gap) {
      continue;
    }

    const gapNode = buildGapNode(gap, dimension.name);

    nodes.push(gapNode);
    edges.push(
      createEdge({
        kind: "dimension_to_gap",
        source: dimensionNode.id,
        target: gapNode.id,
        label: `优先级 ${gap.priority?.toFixed(1) ?? "0.0"}`,
        summary: gap.summary,
        dimensionId: dimension.id
      })
    );
  }

  return applyLayout({
    goalNodeId: goalNode.id,
    nodes,
    edges
  });
}
