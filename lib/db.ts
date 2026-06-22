import { Pool, type QueryResultRow } from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://ronda:ronda@127.0.0.1:5432/rondasmart";

const globalForPg = globalThis as unknown as { rondaSmartPool?: Pool };

export const pool =
  globalForPg.rondaSmartPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.rondaSmartPool = pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}

export function rowToCamel<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value
    ])
  );
}

export function rowsToCamel<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map((row) => rowToCamel(row));
}
