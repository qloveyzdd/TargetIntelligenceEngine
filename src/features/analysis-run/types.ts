export type GoalStage = "idea" | "validation" | "mvp" | "growth";

export type GoalCard = {
  name: string;
  category: string;
  jobToBeDone: string;
  hardConstraints: string[];
  softPreferences: string[];
  currentStage: GoalStage;
};

export type DimensionDirection = "higher_better" | "lower_better";
export type DimensionLayer = "core" | "domain" | "project";
export type SourceType = "official_site" | "docs" | "pricing" | "review";

export type Dimension = {
  id: string;
  name: string;
  weight: number;
  direction: DimensionDirection;
  definition: string;
  evidenceNeeded: string[];
  layer: DimensionLayer;
  enabled: boolean;
};

export type SearchPlanMode = "same_goal" | "dimension_leader";

export type CandidateSource = {
  sourceType: SourceType;
  url: string;
};

export type Candidate = {
  id: string;
  name: string;
  matchedModes: SearchPlanMode[];
  officialUrl: string | null;
  strengthDimensions: string[];
  sources: CandidateSource[];
  matchedQueries: string[];
  recallRank: number;
};

export type SearchPlanItem = {
  id: string;
  mode: SearchPlanMode;
  dimensionId: string | null;
  query: string;
  whatToFind: string;
  whyThisSearch: string;
  expectedCandidateCount: number;
  sourceHints: SourceType[];
};

export type SearchPlanStatus = "draft" | "confirmed";

export type SearchPlan = {
  status: SearchPlanStatus;
  items: SearchPlanItem[];
  confirmedAt: string | null;
};

export type Evidence = {
  candidateId: string;
  dimensionId: string;
  sourceType: SourceType;
  url: string;
  excerpt: string;
  extractedValue: string;
  confidence: number;
  capturedAt: string;
};

export type StageGoal = {
  stage: string;
  objective: string;
  relatedDimensions: string[];
  benchmarkProducts: string[];
  successMetrics: string[];
  deliverables: string[];
  risks: string[];
};

export type AnalysisRunStatus =
  | "draft"
  | "goal_ready"
  | "goal_confirmed"
  | "dimensions_ready"
  | "search_plan_ready"
  | "search_plan_confirmed"
  | "candidates_ready"
  | "evidence_ready";

export type AnalysisRun = {
  id: string;
  status: AnalysisRunStatus;
  inputText: string;
  inputNotes: string | null;
  goal: GoalCard | null;
  dimensions: Dimension[];
  searchPlan: SearchPlan | null;
  candidates: Candidate[];
  evidence: Evidence[];
  stageGoals: StageGoal[];
  createdAt: string;
  updatedAt: string;
};

export type AnalysisRunUpdate = Partial<
  Pick<
    AnalysisRun,
    | "status"
    | "inputNotes"
    | "goal"
    | "dimensions"
    | "searchPlan"
    | "candidates"
    | "evidence"
    | "stageGoals"
  >
>;
