import { chmodSync, mkdirSync } from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { databasePath } from "@back/lib/db/config";
import { applyMigrations } from "@back/lib/db/migrations";
import { normalizeSearch } from "@back/lib/catalog/normalize";

export type AppDatabase = BetterSqlite3.Database;

export function openDatabase(filePath = databasePath(), migrate = true): AppDatabase {
  if (filePath !== ":memory:") mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const db = new BetterSqlite3(filePath);
  db.function("normalize_search", { deterministic: true }, (value: unknown) => normalizeSearch(value === null || value === undefined ? "" : String(value)));
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  if (filePath !== ":memory:") db.pragma("journal_mode = WAL");
  if (filePath !== ":memory:") {
    chmodSync(filePath, 0o600);
    for (const suffix of ["-wal", "-shm"]) {
      try { chmodSync(`${filePath}${suffix}`, 0o600); } catch { /* sidecar is created lazily */ }
    }
  }
  if (migrate) applyMigrations(db);
  return db;
}

let singleton: AppDatabase | undefined;

export function getDatabase(): AppDatabase {
  singleton ??= openDatabase();
  return singleton;
}

export function closeDatabase() {
  singleton?.close();
  singleton = undefined;
}
