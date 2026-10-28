import { chmodSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";

const dbPath = process.env.JLPT_DB_PATH || path.resolve(process.cwd(), "var", "jlpt.sqlite");
const backupDir = process.env.JLPT_BACKUP_DIR || path.resolve(process.cwd(), "backups");
const prune = process.argv.includes("--prune");
mkdirSync(backupDir, { recursive: true, mode: 0o700 });
const source = new BetterSqlite3(dbPath, { readonly: true, fileMustExist: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = path.join(backupDir, `jlpt-${stamp}.sqlite`);
let completed = false;
function weekKey(name) {
  const monday = new Date(`${name.slice(5, 15)}T00:00:00.000Z`);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}
try {
  await source.backup(destination);
  chmodSync(destination, 0o600);
  const copy = new BetterSqlite3(destination, { readonly: true, fileMustExist: true });
  const integrity = copy.pragma("integrity_check", { simple: true });
  const metadata = {
    createdAt: new Date().toISOString(),
    deploymentRevision: process.env.JLPT_GIT_REVISION || "unknown",
    integrity,
    migrations: copy.prepare("SELECT version,name,applied_at FROM schema_migrations ORDER BY version").all(),
    counts: {
      books: copy.prepare("SELECT COUNT(*) count FROM books").get().count,
      entries: copy.prepare("SELECT COUNT(*) count FROM book_entries").get().count,
      reviewEvents: copy.prepare("SELECT COUNT(*) count FROM review_events").get().count,
    },
  };
  copy.close();
  for (const suffix of ["-shm", "-wal"]) {
    try { unlinkSync(`${destination}${suffix}`); } catch { /* sidecar may not exist */ }
  }
  if (integrity !== "ok") throw new Error(`backup integrity check failed: ${integrity}`);
  const metadataPath = `${destination}.json`;
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, { mode: 0o600 });
  chmodSync(metadataPath, 0o600);
  completed = true;
  if (prune) {
    const backups = readdirSync(backupDir).filter((name) => /^jlpt-.*\.sqlite$/.test(name)).sort().reverse();
    const keep = new Set(backups.slice(0, 7));
    const weeks = new Set();
    for (const name of backups.slice(7)) {
      const week = weekKey(name);
      if (weeks.size < 4 && !weeks.has(week)) { weeks.add(week); keep.add(name); }
    }
    for (const name of backups) if (!keep.has(name)) {
      unlinkSync(path.join(backupDir, name));
      try { unlinkSync(path.join(backupDir, `${name}.json`)); } catch { /* metadata may not exist */ }
    }
  }
  console.log(JSON.stringify({ backup: destination, ...metadata.counts }));
} finally {
  if (!completed) {
    try { unlinkSync(destination); } catch { /* failed backup may not exist */ }
    try { unlinkSync(`${destination}.json`); } catch { /* failed metadata may not exist */ }
  }
  source.close();
}
