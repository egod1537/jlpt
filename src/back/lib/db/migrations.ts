import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";

const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "db", "migrations");

export function applyMigrations(db: Database.Database) {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)");
  const applied = new Set(db.prepare("SELECT version FROM schema_migrations").all().map((row) => (row as { version: number }).version));
  const files = readdirSync(migrationsDirectory).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  const migrate = db.transaction((file: string) => {
    const version = Number(file.split("_", 1)[0]);
    db.exec(readFileSync(path.join(migrationsDirectory, file), "utf8"));
    db.prepare("INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)").run(version, file, new Date().toISOString());
  });
  for (const file of files) {
    const version = Number(file.split("_", 1)[0]);
    if (!applied.has(version)) migrate(file);
  }
  return files.length;
}
