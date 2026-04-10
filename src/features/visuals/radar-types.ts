import type {
  DimensionDirection,
  DimensionScoreStatus,
  SearchPlanMode
} from "@/features/analysis-run/types";

export type RadarAxis = {
  dimensionId: string;
  label: string;
  definition: string;
  direction: DimensionDirection;
  weight: number;
  max: number;
};

export type RadarDimensionValue = {
  dimensionId: string;
  label: string;
  status: DimensionScoreStatus;
  value: number | null;
  coverage: number;
  evidenceIds: string[];
  summary: string;
};

export type RadarSeries = {
  id: string;
  label: string;
  kind: "goal" | "candidate";
  candidateId: string | null;
  overallScore: number | null;
  coverage: number;
  unknownCount: number;
  matchedModes: SearchPlanMode[];
  values: RadarDimensionValue[];
};

export type RadarCandidateSelection = {
  availableCandidateIds: string[];
  defaultCandidateIds: string[];
  selectedCandidateIds: string[];
};

export type RadarChartModel = {
  goalLabel: string;
  axes: RadarAxis[];
  series: RadarSeries[];
  selection: RadarCandidateSelection;
};
