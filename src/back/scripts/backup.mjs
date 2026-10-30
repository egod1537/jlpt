import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { chmod, lstat, mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import BetterSqlite3 from "better-sqlite3";

const dbPath = path.resolve(process.env.JLPT_DB_PATH || path.join(process.cwd(), "var", "jlpt.sqlite"));
const backupDir = path.resolve(process.env.JLPT_BACKUP_DIR || path.join(process.cwd(), "backups"));
const audioDir = absoluteConfiguredPath(process.env.JLPT_AUDIO_DIR, path.join(path.dirname(dbPath), "listening", "audio"), "JLPT_AUDIO_DIR");
const prune = process.argv.includes("--prune");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const name = `jlpt-${stamp}`;
const staging = path.join(backupDir, `.${name}.${randomUUID()}.partial`);
const destination = path.join(backupDir, name);
let source;
let completed = false;

try {
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  await mkdir(staging, { mode: 0o700 });
  source = new BetterSqlite3(dbPath, { readonly: true, fileMustExist: true });
  const snapshotDbPath = path.join(staging, "database.sqlite");
  await source.backup(snapshotDbPath);
  await chmod(snapshotDbPath, 0o600);

  const snapshot = new BetterSqlite3(snapshotDbPath, { readonly: true, fileMustExist: true });
  const integrity = snapshot.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") throw new Error(`backup integrity check failed: ${integrity}`);
  const migrations = hasTable(snapshot, "schema_migrations")
    ? snapshot.prepare("SELECT version,name,applied_at FROM schema_migrations ORDER BY version").all()
    : [];
  const audioRows = hasTable(snapshot, "listening_audio")
    ? snapshot.prepare("SELECT id,stored_key,size_bytes,sha256 FROM listening_audio ORDER BY id").all()
    : [];
  const counts = {
    books: count(snapshot, "books"),
    entries: count(snapshot, "book_entries"),
    reviewEvents: count(snapshot, "review_events"),
    listeningAudio: audioRows.length,
    transcriptVersions: count(snapshot, "listening_transcript_versions"),
  };
  snapshot.close();

  const audioFiles = [];
  for (const row of audioRows) {
    const storedKey = safeStoredKey(String(row.stored_key));
    const sourcePath = path.join(audioDir, ...storedKey.split("/"));
    const targetPath = path.join(staging, "audio", ...storedKey.split("/"));
    const info = await lstat(sourcePath).catch(() => null);
    if (!info?.isFile() || info.isSymbolicLink()) throw new Error(`audio file missing or unsafe: ${row.id}`);
    await mkdir(path.dirname(targetPath), { recursive: true, mode: 0o700 });
    const copied = await copyWithSha256(sourcePath, targetPath);
    const expectedSha256 = String(row.sha256).toLowerCase();
    if (copied.bytes !== Number(row.size_bytes) || copied.sha256 !== expectedSha256) throw new Error(`audio checksum mismatch: ${row.id}`);
    await chmod(targetPath, 0o600);
    audioFiles.push({ audioId: String(row.id), storedKey, sizeBytes: copied.bytes, sha256: copied.sha256 });
  }

  const database = await hashFile(snapshotDbPath);
  const manifest = {
    format: "jlpt-listening-snapshot",
    version: 1,
    createdAt: new Date().toISOString(),
    deploymentRevision: process.env.JLPT_GIT_REVISION || "unknown",
    database: { file: "database.sqlite", ...database, integrity: "ok" },
    migrations,
    counts,
    audio: { root: "audio", files: audioFiles },
    excludedSecrets: ["JLPT_OPENAI_AUTH_PATH", "JLPT_EXTERNAL_API_KEY", "JLPT_ACCESS_TOKEN", "WHISPER_AUTH_TOKEN"],
  };
  await writeFile(path.join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await rename(staging, destination);
  completed = true;

  if (prune) await pruneSnapshots(backupDir);
  console.log(JSON.stringify({ backup: destination, ...counts, audioBytes: audioFiles.reduce((sum, file) => sum + file.sizeBytes, 0) }));
} finally {
  source?.close();
  if (!completed) await rm(staging, { recursive: true, force: true });
}

function absoluteConfiguredPath(value, fallback, label) {
  if (!value?.trim()) return path.resolve(fallback);
  if (!path.isAbsolute(value)) throw new Error(`${label} must be an absolute path`);
  return path.normalize(value);
}
function hasTable(db, table) { return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table)); }
function count(db, table) { return hasTable(db, table) ? Number(db.prepare(`SELECT COUNT(*) count FROM ${table}`).get().count) : 0; }
function safeStoredKey(value) {
  if (!value || path.isAbsolute(value) || value.includes("\\") || value.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("unsafe stored audio key");
  return value;
}
async function copyWithSha256(sourcePath, targetPath) {
  const hash = createHash("sha256"); let bytes = 0;
  const meter = new Transform({ transform(chunk, _encoding, callback) { bytes += chunk.length; hash.update(chunk); callback(null, chunk); } });
  await pipeline(createReadStream(sourcePath), meter, createWriteStream(targetPath, { flags: "wx", mode: 0o600 }));
  return { bytes, sha256: hash.digest("hex") };
}
async function hashFile(filePath) {
  const hash = createHash("sha256"); let sizeBytes = 0;
  for await (const chunk of createReadStream(filePath)) { sizeBytes += chunk.length; hash.update(chunk); }
  return { sizeBytes, sha256: hash.digest("hex") };
}
function weekKey(snapshot) {
  const date = snapshot.match(/^jlpt-(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!date) return snapshot;
  const monday = new Date(`${date}T00:00:00.000Z`);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}
async function pruneSnapshots(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const snapshots = entries.filter((entry) => entry.isDirectory() && /^jlpt-\d{4}-/.test(entry.name)).map((entry) => entry.name).sort().reverse();
  const keep = new Set(snapshots.slice(0, 7)); const weeks = new Set();
  for (const snapshot of snapshots.slice(7)) {
    const week = weekKey(snapshot);
    if (weeks.size < 4 && !weeks.has(week)) { weeks.add(week); keep.add(snapshot); }
  }
  for (const snapshot of snapshots) if (!keep.has(snapshot)) await rm(path.join(directory, snapshot), { recursive: true });
}
