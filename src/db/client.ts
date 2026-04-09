import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __targetIntelligencePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __targetIntelligenceDb:
    | ReturnType<typeof drizzle<typeof schema>>
    | undefined;
}

function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required when ANALYSIS_RUN_STORE is not "memory".'
    );
  }

  return connectionString;
}

export function getDb() {
  if (!globalThis.__targetIntelligencePool) {
    globalThis.__targetIntelligencePool = new Pool({
      connectionString: getDatabaseUrl()
    });
  }

  if (!globalThis.__targetIntelligenceDb) {
    globalThis.__targetIntelligenceDb = drizzle(globalThis.__targetIntelligencePool, {
      schema
    });
  }

  return globalThis.__targetIntelligenceDb;
}
