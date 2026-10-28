import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { openDatabase } from "@back/lib/db/database";
import { seedDatabase } from "@back/lib/seed/seed";

const temporary = mkdtempSync(path.join(tmpdir(), "jlpt-e2e-"));
const dbPath = path.join(temporary, "jlpt.sqlite");
const seedPath = path.resolve(process.cwd(), "..", "..", "jlpt-vocabulary-dataset", "data");
const migrationsPath = path.resolve(process.cwd(), "..", "back", "db", "migrations");
const port = process.env.JLPT_E2E_PORT || "4174";
const db = openDatabase(dbPath);
seedDatabase(db, seedPath);
db.close();

const environment: NodeJS.ProcessEnv = {
  ...process.env,
  JLPT_DB_PATH: dbPath,
  JLPT_SEED_DATA: seedPath,
  JLPT_MIGRATIONS_DIR: migrationsPath,
  JLPT_APP_ORIGIN: `http://127.0.0.1:${port}`,
};
const next = path.resolve(process.cwd(), "node_modules", ".bin", "next");
const child = spawn(next, ["dev", "--hostname", "127.0.0.1", "--port", port], { cwd: process.cwd(), env: environment, stdio: "inherit" });
const cleanup = () => { try { rmSync(temporary, { recursive: true, force: true }); } catch { /* best effort test cleanup */ } };
child.on("exit", (code) => { cleanup(); process.exit(code ?? 0); });
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => child.kill(signal));
