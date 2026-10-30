import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { openDatabase } from "@back/lib/db/database";
import { seedDatabase } from "@back/lib/seed/seed";

const temporary = mkdtempSync(path.join(tmpdir(), "jlpt-e2e-"));
const dbPath = path.join(temporary, "jlpt.sqlite");
const seedPath = path.resolve(process.cwd(), "..", "..", "dataset", "data");
const migrationsPath = path.resolve(process.cwd(), "..", "back", "db", "migrations");
const port = process.env.JLPT_E2E_PORT || "4174";
const whisperPort = process.env.JLPT_E2E_WHISPER_PORT || "4175";
const db = openDatabase(dbPath);
seedDatabase(db, seedPath);
db.close();

const environment: NodeJS.ProcessEnv = {
  ...process.env,
  JLPT_DB_PATH: dbPath,
  JLPT_SEED_DATA: seedPath,
  JLPT_MIGRATIONS_DIR: migrationsPath,
  JLPT_APP_ORIGIN: `http://127.0.0.1:${port}`,
  JLPT_EXTERNAL_API_KEY: "e2e-external-api-key",
  WHISPER_BASE_URL: `http://127.0.0.1:${whisperPort}`,
  WHISPER_ALLOWED_HOSTS: `127.0.0.1:${whisperPort}`,
  WHISPER_TIMEOUT_MS: "10000",
};
const whisper = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.method === "POST" && request.url === "/api/v1/jobs") {
    request.resume(); response.end(JSON.stringify({ id: "e2e-whisper-job" })); return;
  }
  if (request.method === "GET" && request.url === "/api/v1/jobs/e2e-whisper-job") {
    response.end(JSON.stringify({ id: "e2e-whisper-job", status: "completed", phase: "exporting" })); return;
  }
  if (request.method === "GET" && request.url === "/api/v1/jobs/e2e-whisper-job/results/json") {
    response.end(JSON.stringify({ languageDetected: "ja", segments: [{ startMs: 0, endMs: 500, text: "明日の会議は何時ですか。", confidence: 0.99 }] })); return;
  }
  response.statusCode = 404; response.end(JSON.stringify({ error: "not found" }));
});
whisper.listen(Number(whisperPort), "127.0.0.1");
const next = path.resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [next, "start", "--hostname", "127.0.0.1", "--port", port], { cwd: process.cwd(), env: environment, stdio: "inherit" });
const cleanup = () => { whisper.close(); try { rmSync(temporary, { recursive: true, force: true }); } catch { /* best effort test cleanup */ } };
child.on("exit", (code) => { cleanup(); process.exit(code ?? 0); });
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => child.kill(signal));
