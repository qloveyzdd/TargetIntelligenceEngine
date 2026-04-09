import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type {
  Candidate,
  Dimension,
  GoalCard,
  SearchPlan,
  StageGoal,
  Evidence
} from "@/features/analysis-run/types";

export const analysisRuns = pgTable("analysis_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: text("status").notNull().default("draft"),
  inputText: text("input_text").notNull(),
  inputNotes: text("input_notes"),
  goal: jsonb("goal").$type<GoalCard | null>(),
  dimensions: jsonb("dimensions")
    .$type<Dimension[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  searchPlan: jsonb("search_plan").$type<SearchPlan | null>(),
  candidates: jsonb("candidates")
    .$type<Candidate[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  evidence: jsonb("evidence")
    .$type<Evidence[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  stageGoals: jsonb("stage_goals")
    .$type<StageGoal[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export type AnalysisRunRow = typeof analysisRuns.$inferSelect;
export type NewAnalysisRunRow = typeof analysisRuns.$inferInsert;
