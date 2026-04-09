import type { AnalysisRunRow } from "@/db/schema";
import type {
  AnalysisRun,
  Candidate,
  CandidateSource,
  Dimension,
  Evidence,
  GoalCard,
  SearchPlan,
  SearchPlanItem,
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
      typeof dimension.layer === "string" &&
      typeof dimension.enabled === "boolean"
    );
  });
}

function toCandidateSources(value: unknown): CandidateSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is CandidateSource => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const source = item as Record<string, unknown>;

    return typeof source.sourceType === "string" && typeof source.url === "string";
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
    const matchedModes = toStringArray(candidate.matchedModes);
    const strengthDimensions = toStringArray(candidate.strengthDimensions);
    const matchedQueries = toStringArray(candidate.matchedQueries);
    const sources = toCandidateSources(candidate.sources);

    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      matchedModes.length === (Array.isArray(candidate.matchedModes) ? candidate.matchedModes.length : -1) &&
      strengthDimensions.length ===
        (Array.isArray(candidate.strengthDimensions) ? candidate.strengthDimensions.length : -1) &&
      matchedQueries.length ===
        (Array.isArray(candidate.matchedQueries) ? candidate.matchedQueries.length : -1) &&
      sources.length === (Array.isArray(candidate.sources) ? candidate.sources.length : -1) &&
      typeof candidate.recallRank === "number" &&
      (typeof candidate.officialUrl === "string" || candidate.officialUrl === null)
    );
  });
}

function toSearchPlanItems(value: unknown): SearchPlanItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is SearchPlanItem => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const searchPlanItem = item as Record<string, unknown>;

    return (
      typeof searchPlanItem.id === "string" &&
      typeof searchPlanItem.mode === "string" &&
      (typeof searchPlanItem.dimensionId === "string" ||
        searchPlanItem.dimensionId === null) &&
      typeof searchPlanItem.query === "string" &&
      typeof searchPlanItem.whatToFind === "string" &&
      typeof searchPlanItem.whyThisSearch === "string" &&
      typeof searchPlanItem.expectedCandidateCount === "number" &&
      Array.isArray(searchPlanItem.sourceHints)
    );
  });
}

function toSearchPlan(value: unknown): SearchPlan | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const searchPlan = value as Record<string, unknown>;

  if (
    typeof searchPlan.status !== "string" ||
    (searchPlan.confirmedAt !== null && typeof searchPlan.confirmedAt !== "string")
  ) {
    return null;
  }

  return {
    status: searchPlan.status as SearchPlan["status"],
    items: toSearchPlanItems(searchPlan.items),
    confirmedAt: searchPlan.confirmedAt as SearchPlan["confirmedAt"]
  };
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
    searchPlan: toSearchPlan(row.searchPlan),
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
    searchPlan: null,
    candidates: [],
    evidence: [],
    stageGoals: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
