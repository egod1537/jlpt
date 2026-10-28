import { mkdirSync } from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { databasePath } from "@back/lib/db/config";
import { applyMigrations } from "@back/lib/db/migrations";

export type AppDatabase = BetterSqlite3.Database;

export function openDatabase(filePath = databasePath(), migrate = true): AppDatabase {
  if (filePath !== ":memory:") mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const db = new BetterSqlite3(filePath);
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  if (filePath !== ":memory:") db.pragma("journal_mode = WAL");
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
