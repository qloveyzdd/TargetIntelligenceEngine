import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { analysisRuns } from "@/db/schema";
import { createDraftRunAggregate, toAnalysisRun } from "./run-mappers";
import type { AnalysisRun, AnalysisRunUpdate } from "./types";

type AnalysisRunStore = {
  create(run: AnalysisRun): Promise<AnalysisRun>;
  getById(id: string): Promise<AnalysisRun | null>;
  update(id: string, update: AnalysisRunUpdate): Promise<AnalysisRun | null>;
  listRecent(limit?: number): Promise<AnalysisRun[]>;
};

declare global {
  var __targetIntelligenceMemoryRuns: Map<string, AnalysisRun> | undefined;
}

function cloneRun<T>(value: T): T {
  return structuredClone(value);
}

export function createInMemoryAnalysisRunStore(): AnalysisRunStore {
  const records =
    globalThis.__targetIntelligenceMemoryRuns ??
    (globalThis.__targetIntelligenceMemoryRuns = new Map<string, AnalysisRun>());

  return {
    async create(run) {
      records.set(run.id, cloneRun(run));
      return cloneRun(run);
    },
    async getById(id) {
      const run = records.get(id);
      return run ? cloneRun(run) : null;
    },
    async update(id, update) {
      const current = records.get(id);

      if (!current) {
        return null;
      }

      const nextRun: AnalysisRun = {
        ...current,
        ...update,
        inputNotes:
          update.inputNotes === undefined ? current.inputNotes : update.inputNotes ?? null,
        updatedAt: new Date().toISOString()
      };

      records.set(id, cloneRun(nextRun));
      return cloneRun(nextRun);
    },
    async listRecent(limit = 5) {
      return Array.from(records.values())
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, limit)
        .map(cloneRun);
    }
  };
}

function createDatabaseAnalysisRunStore(): AnalysisRunStore {
  return {
    async create(run) {
      const [created] = await getDb()
        .insert(analysisRuns)
        .values({
          id: run.id,
          status: run.status,
          inputText: run.inputText,
          inputNotes: run.inputNotes,
          goal: run.goal,
          dimensions: run.dimensions,
          candidates: run.candidates,
          evidence: run.evidence,
          stageGoals: run.stageGoals,
          createdAt: new Date(run.createdAt),
          updatedAt: new Date(run.updatedAt)
        })
        .returning();

      return toAnalysisRun(created);
    },
    async getById(id) {
      const [row] = await getDb()
        .select()
        .from(analysisRuns)
        .where(eq(analysisRuns.id, id));

      return row ? toAnalysisRun(row) : null;
    },
    async update(id, update) {
      const [row] = await getDb()
        .update(analysisRuns)
        .set({
          ...update,
          updatedAt: new Date()
        })
        .where(eq(analysisRuns.id, id))
        .returning();

      return row ? toAnalysisRun(row) : null;
    },
    async listRecent(limit = 5) {
      const rows = await getDb()
        .select()
        .from(analysisRuns)
        .orderBy(desc(analysisRuns.updatedAt))
        .limit(limit);

      return rows.map(toAnalysisRun);
    }
  };
}

function resolveStore(store?: AnalysisRunStore) {
  if (store) {
    return store;
  }

  if (process.env.ANALYSIS_RUN_STORE === "memory") {
    return createInMemoryAnalysisRunStore();
  }

  return createDatabaseAnalysisRunStore();
}

export async function createDraftRun(
  input: { inputText: string; inputNotes?: string | null },
  store?: AnalysisRunStore
) {
  const run = createDraftRunAggregate(input);
  return resolveStore(store).create(run);
}

export async function getRunById(id: string, store?: AnalysisRunStore) {
  return resolveStore(store).getById(id);
}

export async function updateRunAggregate(
  id: string,
  update: AnalysisRunUpdate,
  store?: AnalysisRunStore
) {
  return resolveStore(store).update(id, update);
}

export async function listRecentRuns(limit = 5, store?: AnalysisRunStore) {
  return resolveStore(store).listRecent(limit);
}
