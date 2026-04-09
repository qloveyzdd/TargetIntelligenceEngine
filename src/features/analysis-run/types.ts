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

export type Dimension = {
  id: string;
  name: string;
  weight: number;
  direction: DimensionDirection;
  definition: string;
  evidenceNeeded: string[];
  layer: DimensionLayer;
};

export type Candidate = {
  id: string;
  name: string;
  matchedModes: string[];
  officialUrl: string | null;
  strengthDimensions: string[];
};

export type Evidence = {
  candidateId: string;
  dimensionId: string;
  sourceType: string;
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

export type AnalysisRunStatus = "draft" | "goal_ready" | "goal_confirmed";

export type AnalysisRun = {
  id: string;
  status: AnalysisRunStatus;
  inputText: string;
  inputNotes: string | null;
  goal: GoalCard | null;
  dimensions: Dimension[];
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
    | "candidates"
    | "evidence"
    | "stageGoals"
  >
>;
