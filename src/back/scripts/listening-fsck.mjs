import { lstat, mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";

const dbPath = path.resolve(process.env.JLPT_DB_PATH || path.join(process.cwd(), "var", "jlpt.sqlite"));
const audioDir = configuredPath(process.env.JLPT_AUDIO_DIR, path.join(path.dirname(dbPath), "listening", "audio"));
const quarantine = process.argv.includes("--quarantine");
const db = new BetterSqlite3(dbPath, { readonly: true, fileMustExist: true });
const references = new Map(db.prepare("SELECT id,stored_key FROM listening_audio").all().map((row) => [String(row.stored_key), String(row.id)]));
db.close();
const files = await walk(audioDir); const fileSet = new Set(files);
const missing = [...references].filter(([storedKey]) => !fileSet.has(storedKey)).map(([storedKey, audioId]) => ({ audioId, storedKey }));
const orphans = files.filter((storedKey) => !references.has(storedKey));
let quarantineDirectory = null;
if (quarantine && orphans.length) {
  quarantineDirectory = path.join(path.dirname(audioDir), "orphan-quarantine", new Date().toISOString().replace(/[:.]/g, "-"));
  for (const storedKey of orphans) {
    const destination = path.join(quarantineDirectory, ...storedKey.split("/"));
    await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await rename(path.join(audioDir, ...storedKey.split("/")), destination);
  }
}
console.log(JSON.stringify({ databaseRecords: references.size, storedFiles: files.length, missing, orphans, quarantined: quarantine ? orphans.length : 0, quarantineDirectory }, null, 2));
if (missing.length) process.exitCode = 2;

function configuredPath(value, fallback) { if (!value?.trim()) return path.resolve(fallback); if (!path.isAbsolute(value)) throw new Error("JLPT_AUDIO_DIR must be absolute"); return path.normalize(value); }
async function walk(root, relative = "") {
  const current = path.join(root, relative);
  const entries = await readdir(current, { withFileTypes: true }).catch((error) => error?.code === "ENOENT" ? [] : Promise.reject(error));
  const result = [];
  for (const entry of entries) {
    const next = relative ? path.posix.join(relative.replaceAll("\\", "/"), entry.name) : entry.name;
    const absolute = path.join(root, ...next.split("/"));
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) result.push(...await walk(root, next));
    else if (entry.isFile() && (await lstat(absolute)).isFile()) result.push(next);
  }
  return result.sort();
}
