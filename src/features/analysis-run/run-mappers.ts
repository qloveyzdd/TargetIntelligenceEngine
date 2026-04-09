import type { AnalysisRunRow } from "@/db/schema";
import { assignEvidenceId } from "@/features/evidence/assign-evidence-id";
import type {
  AnalysisRun,
  AnalysisRunScoring,
  Candidate,
  CandidateScorecard,
  CandidateSource,
  Dimension,
  DimensionScorecard,
  Evidence,
  GapPriority,
  GoalCard,
  ScoringContribution,
  SearchPlan,
  SearchPlanItem,
  SearchPlanMode,
  StageGoal
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toGoalCard(value: unknown): GoalCard | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.name !== "string" ||
    typeof value.category !== "string" ||
    typeof value.jobToBeDone !== "string" ||
    typeof value.currentStage !== "string"
  ) {
    return null;
  }

  return {
    name: value.name,
    category: value.category,
    jobToBeDone: value.jobToBeDone,
    currentStage: value.currentStage as GoalCard["currentStage"],
    hardConstraints: toStringArray(value.hardConstraints),
    softPreferences: toStringArray(value.softPreferences)
  };
}

function toDimensions(value: unknown): Dimension[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Dimension => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.weight === "number" &&
      typeof item.direction === "string" &&
      typeof item.definition === "string" &&
      Array.isArray(item.evidenceNeeded) &&
      typeof item.layer === "string" &&
      typeof item.enabled === "boolean"
    );
  });
}

function toCandidateSources(value: unknown): CandidateSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is CandidateSource => {
    if (!isRecord(item)) {
      return false;
    }

    return typeof item.sourceType === "string" && typeof item.url === "string";
  });
}

function toCandidates(value: unknown): Candidate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Candidate => {
    if (!isRecord(item)) {
      return false;
    }

    const matchedModes = toStringArray(item.matchedModes);
    const strengthDimensions = toStringArray(item.strengthDimensions);
    const matchedQueries = toStringArray(item.matchedQueries);
    const sources = toCandidateSources(item.sources);

    return (
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      matchedModes.length === (Array.isArray(item.matchedModes) ? item.matchedModes.length : -1) &&
      strengthDimensions.length ===
        (Array.isArray(item.strengthDimensions) ? item.strengthDimensions.length : -1) &&
      matchedQueries.length ===
        (Array.isArray(item.matchedQueries) ? item.matchedQueries.length : -1) &&
      sources.length === (Array.isArray(item.sources) ? item.sources.length : -1) &&
      typeof item.recallRank === "number" &&
      (typeof item.officialUrl === "string" || item.officialUrl === null)
    );
  });
}

function toSearchPlanItems(value: unknown): SearchPlanItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is SearchPlanItem => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      typeof item.id === "string" &&
      typeof item.mode === "string" &&
      (typeof item.dimensionId === "string" || item.dimensionId === null) &&
      typeof item.query === "string" &&
      typeof item.whatToFind === "string" &&
      typeof item.whyThisSearch === "string" &&
      typeof item.expectedCandidateCount === "number" &&
      Array.isArray(item.sourceHints)
    );
  });
}

function toSearchPlan(value: unknown): SearchPlan | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.status !== "string" ||
    (value.confirmedAt !== null && typeof value.confirmedAt !== "string")
  ) {
    return null;
  }

  return {
    status: value.status as SearchPlan["status"],
    items: toSearchPlanItems(value.items),
    confirmedAt: value.confirmedAt as SearchPlan["confirmedAt"]
  };
}

function toEvidence(value: unknown): Evidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    if (
      typeof item.candidateId !== "string" ||
      typeof item.dimensionId !== "string" ||
      typeof item.sourceType !== "string" ||
      typeof item.url !== "string" ||
      typeof item.excerpt !== "string" ||
      typeof item.extractedValue !== "string" ||
      typeof item.capturedAt !== "string"
    ) {
      return [];
    }

    const confidence = toNumber(item.confidence);

    if (confidence === null) {
      return [];
    }

    const normalized: Evidence = {
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : assignEvidenceId({
              candidateId: item.candidateId,
              dimensionId: item.dimensionId,
              sourceType: item.sourceType as Evidence["sourceType"],
              url: item.url,
              excerpt: item.excerpt,
              extractedValue: item.extractedValue
            }),
      candidateId: item.candidateId,
      dimensionId: item.dimensionId,
      sourceType: item.sourceType as Evidence["sourceType"],
      url: item.url,
      excerpt: item.excerpt,
      extractedValue: item.extractedValue,
      confidence,
      capturedAt: item.capturedAt
    };

    return [normalized];
  });
}

function toScoringContribution(value: unknown): ScoringContribution | null {
  if (!isRecord(value)) {
    return null;
  }

  const confidence = toNumber(value.confidence);
  const sourceWeight = toNumber(value.sourceWeight);
  const contributionWeight = toNumber(value.contributionWeight);
  const evidenceScore = value.evidenceScore === null ? null : toNumber(value.evidenceScore);

  if (
    typeof value.evidenceId !== "string" ||
    typeof value.sourceType !== "string" ||
    confidence === null ||
    sourceWeight === null ||
    contributionWeight === null ||
    typeof value.status !== "string" ||
    typeof value.summary !== "string"
  ) {
    return null;
  }

  return {
    evidenceId: value.evidenceId,
    sourceType: value.sourceType as ScoringContribution["sourceType"],
    confidence,
    sourceWeight,
    contributionWeight,
    evidenceScore,
    status: value.status as ScoringContribution["status"],
    summary: value.summary
  };
}

function toDimensionScorecard(value: unknown): DimensionScorecard | null {
  if (!isRecord(value)) {
    return null;
  }

  const score = value.score === null ? null : toNumber(value.score);
  const coverage = toNumber(value.coverage);

  if (
    typeof value.candidateId !== "string" ||
    typeof value.dimensionId !== "string" ||
    typeof value.status !== "string" ||
    coverage === null ||
    typeof value.summary !== "string"
  ) {
    return null;
  }

  const evidenceIds = toStringArray(value.evidenceIds);
  const contributions = Array.isArray(value.contributions)
    ? value.contributions
        .map((item) => toScoringContribution(item))
        .filter((item): item is ScoringContribution => item !== null)
    : [];

  return {
    candidateId: value.candidateId,
    dimensionId: value.dimensionId,
    status: value.status as DimensionScorecard["status"],
    score,
    coverage,
    evidenceIds,
    contributions,
    summary: value.summary
  };
}

function toCandidateScorecard(value: unknown): CandidateScorecard | null {
  if (!isRecord(value)) {
    return null;
  }

  const overallScore = value.overallScore === null ? null : toNumber(value.overallScore);
  const coverage = toNumber(value.coverage);
  const unknownCount = toNumber(value.unknownCount);

  if (
    typeof value.candidateId !== "string" ||
    coverage === null ||
    unknownCount === null ||
    !Array.isArray(value.dimensionScorecards)
  ) {
    return null;
  }

  const dimensionScorecards = value.dimensionScorecards
    .map((item) => toDimensionScorecard(item))
    .filter((item): item is DimensionScorecard => item !== null);

  return {
    candidateId: value.candidateId,
    overallScore,
    coverage,
    unknownCount,
    dimensionScorecards
  };
}

function toGapPriority(value: unknown): GapPriority | null {
  if (!isRecord(value)) {
    return null;
  }

  const benchmarkScore =
    value.benchmarkScore === null ? null : toNumber(value.benchmarkScore);
  const baselineScore = value.baselineScore === null ? null : toNumber(value.baselineScore);
  const gapSize = value.gapSize === null ? null : toNumber(value.gapSize);
  const priority = value.priority === null ? null : toNumber(value.priority);

  if (typeof value.dimensionId !== "string" || typeof value.status !== "string") {
    return null;
  }

  return {
    dimensionId: value.dimensionId,
    status: value.status as GapPriority["status"],
    benchmarkCandidateId:
      typeof value.benchmarkCandidateId === "string" ? value.benchmarkCandidateId : null,
    benchmarkCandidateName:
      typeof value.benchmarkCandidateName === "string" ? value.benchmarkCandidateName : null,
    benchmarkMatchedModes: toStringArray(value.benchmarkMatchedModes) as SearchPlanMode[],
    benchmarkEvidenceIds: toStringArray(value.benchmarkEvidenceIds),
    benchmarkScore,
    baselineScore,
    gapSize,
    priority,
    summary: typeof value.summary === "string" ? value.summary : ""
  };
}

function toAnalysisRunScoring(value: unknown): AnalysisRunScoring | null {
  if (!isRecord(value) || typeof value.generatedAt !== "string") {
    return null;
  }

  const candidateScorecards = Array.isArray(value.candidateScorecards)
    ? value.candidateScorecards
        .map((item) => toCandidateScorecard(item))
        .filter((item): item is CandidateScorecard => item !== null)
    : [];
  const gaps = Array.isArray(value.gaps)
    ? value.gaps
        .map((item) => toGapPriority(item))
        .filter((item): item is GapPriority => item !== null)
    : [];

  return {
    generatedAt: value.generatedAt,
    candidateScorecards,
    gaps
  };
}

function toStageGoals(value: unknown): StageGoal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is StageGoal => {
    if (!isRecord(item)) {
      return false;
    }

    return (
      typeof item.stage === "string" &&
      typeof item.objective === "string" &&
      Array.isArray(item.relatedDimensions) &&
      Array.isArray(item.benchmarkProducts) &&
      Array.isArray(item.successMetrics) &&
      Array.isArray(item.deliverables) &&
      Array.isArray(item.risks)
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
    scoring: toAnalysisRunScoring(row.scoring),
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
    scoring: null,
    stageGoals: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
