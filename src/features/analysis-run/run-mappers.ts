import type { AnalysisRunRow } from "@/db/schema";
import type {
  AnalysisRun,
  Candidate,
  Dimension,
  Evidence,
  GoalCard,
  StageGoal
} from "./types";

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toGoalCard(value: unknown): GoalCard | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const card = value as Record<string, unknown>;

  if (
    typeof card.name !== "string" ||
    typeof card.category !== "string" ||
    typeof card.jobToBeDone !== "string" ||
    typeof card.currentStage !== "string"
  ) {
    return null;
  }

  return {
    name: card.name,
    category: card.category,
    jobToBeDone: card.jobToBeDone,
    currentStage: card.currentStage as GoalCard["currentStage"],
    hardConstraints: toStringArray(card.hardConstraints),
    softPreferences: toStringArray(card.softPreferences)
  };
}

function toDimensions(value: unknown): Dimension[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Dimension => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const dimension = item as Record<string, unknown>;

    return (
      typeof dimension.id === "string" &&
      typeof dimension.name === "string" &&
      typeof dimension.weight === "number" &&
      typeof dimension.direction === "string" &&
      typeof dimension.definition === "string" &&
      Array.isArray(dimension.evidenceNeeded) &&
      typeof dimension.layer === "string"
    );
  });
}

function toCandidates(value: unknown): Candidate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Candidate => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Record<string, unknown>;

    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      Array.isArray(candidate.matchedModes) &&
      Array.isArray(candidate.strengthDimensions)
    );
  });
}

function toEvidence(value: unknown): Evidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Evidence => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const evidence = item as Record<string, unknown>;

    return (
      typeof evidence.candidateId === "string" &&
      typeof evidence.dimensionId === "string" &&
      typeof evidence.sourceType === "string" &&
      typeof evidence.url === "string" &&
      typeof evidence.excerpt === "string" &&
      typeof evidence.extractedValue === "string" &&
      typeof evidence.confidence === "number" &&
      typeof evidence.capturedAt === "string"
    );
  });
}

function toStageGoals(value: unknown): StageGoal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is StageGoal => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const goal = item as Record<string, unknown>;

    return (
      typeof goal.stage === "string" &&
      typeof goal.objective === "string" &&
      Array.isArray(goal.relatedDimensions) &&
      Array.isArray(goal.benchmarkProducts) &&
      Array.isArray(goal.successMetrics) &&
      Array.isArray(goal.deliverables) &&
      Array.isArray(goal.risks)
    );
  });
}

export function toAnalysisRun(row: AnalysisRunRow): AnalysisRun {
  return {
    id: row.id,
    status: row.status as AnalysisRun["status"],
    inputText: row.inputText,
    inputNotes: row.inputNotes ?? null,
    goal: toGoalCard(row.goal),
    dimensions: toDimensions(row.dimensions),
    candidates: toCandidates(row.candidates),
    evidence: toEvidence(row.evidence),
    stageGoals: toStageGoals(row.stageGoals),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function createDraftRunAggregate(input: {
  inputText: string;
  inputNotes?: string | null;
}): AnalysisRun {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    status: "draft",
    inputText: input.inputText.trim(),
    inputNotes: input.inputNotes?.trim() || null,
    goal: null,
    dimensions: [],
    candidates: [],
    evidence: [],
    stageGoals: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
