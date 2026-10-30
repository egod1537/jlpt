import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { chmod, copyFile, lstat, mkdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";

const snapshotArg = argumentValue("--snapshot") || process.argv.slice(2).find((value) => !value.startsWith("--"));
if (!snapshotArg) throw new Error("usage: restore.mjs --snapshot <directory> [--verify-only] [--force]");
const snapshotDir = path.resolve(snapshotArg);
const verifyOnly = process.argv.includes("--verify-only");
const force = process.argv.includes("--force");
const dbPath = path.resolve(process.env.JLPT_DB_PATH || path.join(process.cwd(), "var", "jlpt.sqlite"));
const audioDir = absoluteConfiguredPath(process.env.JLPT_AUDIO_DIR, path.join(path.dirname(dbPath), "listening", "audio"), "JLPT_AUDIO_DIR");
const manifest = JSON.parse(await readFile(path.join(snapshotDir, "manifest.json"), "utf8"));

validateManifest(manifest);
const snapshotDb = path.join(snapshotDir, manifest.database.file);
await verifyFile(snapshotDb, manifest.database);
const snapshot = new BetterSqlite3(snapshotDb, { readonly: true, fileMustExist: true });
try {
  const integrity = snapshot.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") throw new Error(`snapshot integrity check failed: ${integrity}`);
  for (const [label, table] of [["books", "books"], ["entries", "book_entries"], ["reviewEvents", "review_events"], ["listeningAudio", "listening_audio"], ["transcriptVersions", "listening_transcript_versions"]]) {
    const actual = hasTable(snapshot, table) ? Number(snapshot.prepare(`SELECT COUNT(*) count FROM ${table}`).get().count) : 0;
    if (actual !== Number(manifest.counts[label])) throw new Error(`snapshot count mismatch: ${label}`);
  }
} finally { snapshot.close(); }
for (const file of manifest.audio.files) {
  const storedKey = safeStoredKey(file.storedKey);
  await verifyFile(path.join(snapshotDir, manifest.audio.root, ...storedKey.split("/")), file);
}

if (verifyOnly) {
  console.log(JSON.stringify({ verified: snapshotDir, audioFiles: manifest.audio.files.length, ...manifest.counts }));
  process.exit(0);
}
if (!force && (await exists(dbPath) || await exists(audioDir))) throw new Error("restore targets already exist; stop the services and pass --force after verification");
if (await exists(`${dbPath}-wal`) || await exists(`${dbPath}-shm`)) throw new Error("SQLite WAL sidecars exist; stop web and worker cleanly before restore");
assertSafeTarget(dbPath, false); assertSafeTarget(audioDir, true);
const restoreId = `${Date.now()}-${randomUUID()}`;
const stagedDb = `${dbPath}.restore-${restoreId}`; const stagedAudio = `${audioDir}.restore-${restoreId}`;
const preservedDb = `${dbPath}.pre-restore-${restoreId}`; const preservedAudio = `${audioDir}.pre-restore-${restoreId}`;
await mkdir(path.dirname(dbPath), { recursive: true, mode: 0o700 });
await mkdir(stagedAudio, { recursive: true, mode: 0o700 });
try {
  await copyFile(snapshotDb, stagedDb); await chmod(stagedDb, 0o600);
  for (const file of manifest.audio.files) {
    const storedKey = safeStoredKey(file.storedKey); const target = path.join(stagedAudio, ...storedKey.split("/"));
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await copyFile(path.join(snapshotDir, manifest.audio.root, ...storedKey.split("/")), target); await chmod(target, 0o600);
  }
  if (await exists(audioDir)) await rename(audioDir, preservedAudio);
  await rename(stagedAudio, audioDir);
  if (await exists(dbPath)) await rename(dbPath, preservedDb);
  await rename(stagedDb, dbPath);
  console.log(JSON.stringify({ restored: snapshotDir, database: dbPath, audioDirectory: audioDir, preservedDatabase: await exists(preservedDb) ? preservedDb : null, preservedAudio: await exists(preservedAudio) ? preservedAudio : null }));
} catch (error) {
  await rm(stagedDb, { force: true }); await rm(stagedAudio, { recursive: true, force: true }); throw error;
}

function argumentValue(name) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
function absoluteConfiguredPath(value, fallback, label) { if (!value?.trim()) return path.resolve(fallback); if (!path.isAbsolute(value)) throw new Error(`${label} must be absolute`); return path.normalize(value); }
function hasTable(db, table) { return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table)); }
function validateManifest(value) { if (value?.format !== "jlpt-listening-snapshot" || value?.version !== 1 || value?.database?.file !== "database.sqlite" || !Array.isArray(value?.audio?.files) || value?.audio?.root !== "audio") throw new Error("unsupported snapshot manifest"); }
function safeStoredKey(value) { if (typeof value !== "string" || !value || path.isAbsolute(value) || value.includes("\\") || value.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("unsafe stored audio key"); return value; }
async function verifyFile(filePath, expected) { const info = await lstat(filePath); if (!info.isFile() || info.isSymbolicLink()) throw new Error(`unsafe snapshot file: ${filePath}`); const actual = await hashFile(filePath); if (actual.sizeBytes !== Number(expected.sizeBytes) || actual.sha256 !== expected.sha256) throw new Error(`snapshot checksum mismatch: ${filePath}`); }
async function hashFile(filePath) { const hash = createHash("sha256"); let sizeBytes = 0; for await (const chunk of createReadStream(filePath)) { sizeBytes += chunk.length; hash.update(chunk); } return { sizeBytes, sha256: hash.digest("hex") }; }
async function exists(filePath) { return Boolean(await lstat(filePath).catch(() => null)); }
function assertSafeTarget(target, directory) { const parsed = path.parse(target); if (target === parsed.root || (directory && path.dirname(target) === parsed.root)) throw new Error(`unsafe restore target: ${target}`); }
