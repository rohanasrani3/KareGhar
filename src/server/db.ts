import "server-only";
import postgres from "postgres";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { initializeLocalDb } from "../../scripts/init-local-db.mjs";
import { ART_FORMS } from "@/contract/artForms";
import { seedSamples } from "./samples";

export type Value = string | number | null;
export type Query = <T = Record<string, unknown>>(sql: string, values?: Value[]) => Promise<T[]>;
interface Database {
  query<T>(sql: string, values?: Value[]): Promise<T[]>;
  transaction<T>(work: (query: Query) => Promise<T>): Promise<T>;
}
const SEED_WAIT_MS = 8000;
const SEED_LIMIT_MS = 60000;
const PG_OPTIONS = { prepare: false, connect_timeout: 10, idle_timeout: 20, max_lifetime: 60 * 10 } as const;
const QUERY_TIMEOUT_MS = 15000;

/**
 * A PostgreSQL query that waits on a lock (for example one held by a transaction
 * whose serverless instance was frozen) never errors on its own and would hold the
 * request until the platform's 300 s limit. Cancel it on the server instead and
 * fail with a logged error.
 */
function bounded<T>(pending: Promise<T> & { cancel?: () => unknown }, sql: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      try { pending.cancel?.(); } catch { /* the query may already have settled */ }
      const error = new Error(`Database query exceeded ${QUERY_TIMEOUT_MS / 1000}s: ${sql.replace(/\s+/g, " ").slice(0, 120)}`);
      console.error("[kareghar]", error.message);
      reject(error);
    }, QUERY_TIMEOUT_MS);
  });
  return Promise.race([pending, timeout]).finally(() => clearTimeout(timer));
}
const globalDb = globalThis as typeof globalThis & {
  karegharDb?: Promise<Database>;
};

async function connect(): Promise<Database> {
  const opened = Date.now();
  let database: Database;
  if (process.env.DATABASE_URL) {
    // Serverless-friendly: fail fast instead of hanging until the platform timeout,
    // and release idle pooler connections so frozen instances don't exhaust the pool.
    const client = postgres(process.env.DATABASE_URL, { ...PG_OPTIONS, max: 4 });
    database = {
      async query<T>(sql: string, values: Value[] = []) {
        return Array.from(await bounded(client.unsafe(sql, values), sql)) as T[];
      },
      async transaction<T>(work: (query: Query) => Promise<T>): Promise<T> {
        const result = await client.begin(async (connection) => work(async <R>(sql: string, values: Value[] = []) =>
          Array.from(await bounded(connection.unsafe(sql, values), sql)) as R[]));
        return result as T;
      },
    };
  } else {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.KAREGHAR_LOCAL !== "1"
    )
      throw Error("DATABASE_URL required");
    const { DatabaseSync } = await import("node:sqlite");
    const dataDirectory = process.env.KAREGHAR_DATA_DIR || ".kareghar";
    mkdirSync(dataDirectory, { recursive: true });
    const sqlite = new DatabaseSync(join(dataDirectory, "market.db"));
    initializeLocalDb(sqlite);
    const localQuery: Query = async <T>(sql: string, values: Value[] = []) => {
        const ordered: Value[] = [];
        const statement = sql.replace(/\$(\d+)/g, (_, n) => {
          ordered.push(values[Number(n) - 1]);
          return "?";
        });
        return sqlite
          .prepare(statement)
          .all(...ordered)
          .map((row) => ({ ...row })) as T[];
      };
    // All local operations share one queue so asynchronous transaction callbacks
    // cannot accidentally enlist another request in their SQLite transaction.
    let queue: Promise<unknown> = Promise.resolve();
    const serial = <T>(work: () => Promise<T>): Promise<T> => {
      const result = queue.then(work, work);
      queue = result.catch(() => undefined);
      return result;
    };
    database = {
      query: <T>(sql: string, values?: Value[]) => serial(() => localQuery<T>(sql, values)),
      transaction: <T>(work: (query: Query) => Promise<T>) => serial(async () => {
        sqlite.exec("BEGIN IMMEDIATE");
        try {
          const result = await work(localQuery);
          sqlite.exec("COMMIT");
          return result;
        } catch (error) {
          sqlite.exec("ROLLBACK");
          throw error;
        }
      }),
    };
  }
  // One round trip for the whole seed catalogue (this runs on every cold start).
  await database.query(
    "INSERT INTO forms VALUES " + ART_FORMS.map((_, i) => `($${i * 4 + 1},$${i * 4 + 2},$${i * 4 + 3},$${i * 4 + 4})`).join(",") + " ON CONFLICT DO NOTHING",
    ART_FORMS.flatMap((form) => [form.id, form.category, form.name, form.hi]),
  );
  if (process.env.DATABASE_URL) console.log(`[kareghar] database ready in ${Date.now() - opened} ms`);
  if (!process.env.DATABASE_URL) await seedSamples((sql, values) => database.query(sql, values));
  else if (process.env.KAREGHAR_SEED_SAMPLES === "1") {
    // Hosted: the seed gets its own small connection so its queued statements can
    // never sit in front of page queries. The whole run is capped at SEED_LIMIT_MS,
    // and closing that connection cancels whatever it still has queued. The seed
    // is idempotent and records its version when finished, so a run cut short
    // resumes on a later cold start. Pages wait for it at most SEED_WAIT_MS.
    const seedClient = postgres(process.env.DATABASE_URL, { ...PG_OPTIONS, max: 2 });
    const started = Date.now();
    let limit: ReturnType<typeof setTimeout> | undefined;
    const seeding = Promise.race([
      seedSamples((sql, values) => bounded(seedClient.unsafe(sql, values ?? []), sql)),
      new Promise((_, reject) => { limit = setTimeout(() => reject(new Error(`sample seed exceeded ${SEED_LIMIT_MS / 1000}s`)), SEED_LIMIT_MS); }),
    ])
      .then(
        () => console.log(`[kareghar] sample seed finished in ${Date.now() - started} ms`),
        (error) => console.error("[kareghar] sample seed stopped:", error instanceof Error ? error.message : error),
      )
      .finally(() => {
        clearTimeout(limit);
        return seedClient.end({ timeout: 0 }).catch(() => undefined);
      });
    await Promise.race([seeding, new Promise((resolve) => setTimeout(resolve, SEED_WAIT_MS))]);
  }
  return database;
}
export async function transaction<T>(work: (query: Query) => Promise<T>): Promise<T> {
  globalDb.karegharDb ??= connect().catch((error) => {
    delete globalDb.karegharDb;
    throw error;
  });
  return (await globalDb.karegharDb).transaction(work);
}
export async function query<T>(
  sql: string,
  values: Value[] = [],
): Promise<T[]> {
  globalDb.karegharDb ??= connect().catch((error) => {
    delete globalDb.karegharDb;
    throw error;
  });
  return (await globalDb.karegharDb).query<T>(sql, values);
}
