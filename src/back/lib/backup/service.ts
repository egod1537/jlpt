import { createHash } from "node:crypto";
import type { AppDatabase } from "@back/lib/db/database";
import { bookmarkFromRow, bookFromRow, entryFromRow, folderFromRow, studySessionFromRow } from "@back/lib/catalog/rows";

const fullTables = ["folders", "books", "word_keys", "book_entries", "review_events", "review_states", "study_sessions", "bookmarks", "preferences"] as const;
const progressTables = ["review_events", "review_states", "study_sessions", "bookmarks", "preferences"] as const;
type BackupTable = typeof fullTables[number];
const tableColumns: Record<BackupTable, readonly string[]> = {
  folders: ["id", "name", "name_normalized", "parent_id", "order_index", "revision", "created_at", "updated_at", "deleted_at", "pinned"],
  books: ["id", "title", "category", "folder_id", "favorite", "order_index", "origin", "origin_ref", "revision", "created_at", "updated_at", "deleted_at"],
  word_keys: ["word_id", "created_at", "retired_at"],
  book_entries: ["entry_id", "book_id", "word_id", "position", "term", "reading", "meanings_json", "primary_meaning", "nuance", "part_of_speech_json", "jlpt_levels_json", "years_json", "categories_json", "related_terms_json", "examples_json", "sources_json", "status", "tags_json", "revision", "created_at", "updated_at", "deleted_at"],
  review_events: ["event_id", "operation_id", "word_id", "rating", "occurred_at", "accepted_at", "session_id", "review_context", "scheduler_version"],
  review_states: ["word_id", "scheduler_version", "serialized_state_json", "due_at", "last_reviewed_at", "last_rating", "lapses", "repetitions", "known_flag"],
  study_sessions: ["id", "book_ids_json", "mode", "include_review", "word_ids_json", "position", "revealed", "ratings_json", "status", "revision", "updated_at", "created_at", "deleted_at", "queue_json", "loop_mode", "results_json"],
  bookmarks: ["entry_id", "revision", "created_at", "updated_at"],
  preferences: ["key", "value_json", "revision", "updated_at"],
};

function checksum(data: unknown) { return createHash("sha256").update(JSON.stringify(data)).digest("hex"); }

export function createBackup(db: AppDatabase, scope: "all" | "progress") {
  const tables = scope === "all" ? fullTables : progressTables;
  const data = Object.fromEntries(tables.map((table) => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
  const datasetRevision = Number((db.prepare("SELECT COALESCE(MAX(seq),0) value FROM sync_changes").get() as { value: number }).value);
  return { format_version: "jlpt-owner-backup-v2", scope, exported_at: new Date().toISOString(), dataset_revision: datasetRevision, checksum: checksum(data), data };
}

export function validateBackup(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("백업 JSON 형식이 올바르지 않습니다.");
  const backup = value as Record<string, unknown>;
  const legacy = backup.format_version === "jlpt-owner-backup-v1";
  if (!legacy && backup.format_version !== "jlpt-owner-backup-v2" || (backup.scope !== "all" && backup.scope !== "progress") || !backup.data || typeof backup.data !== "object") throw new Error("지원하지 않는 백업 형식입니다.");
  const data = backup.data as Record<string, unknown>;
  const required = legacy ? (backup.scope === "all" ? fullTables.filter((table) => table !== "bookmarks") : progressTables.filter((table) => table !== "bookmarks")) : (backup.scope === "all" ? fullTables : progressTables);
  for (const table of required) {
    if (!Array.isArray(data[table])) throw new Error(`${table} 데이터가 없습니다.`);
    const allowed = legacy && table === "folders" ? tableColumns.folders.filter((column) => column !== "pinned") : legacy && table === "study_sessions" ? tableColumns.study_sessions.filter((column) => !["queue_json", "loop_mode", "results_json"].includes(column)) : tableColumns[table];
    for (const row of data[table]) {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`${table} 행 형식이 올바르지 않습니다.`);
      const keys = Object.keys(row as Record<string, unknown>);
      if (keys.length !== allowed.length || keys.some((key) => !allowed.includes(key))) throw new Error(`${table} 열 구성이 올바르지 않습니다.`);
    }
  }
  if (backup.checksum !== checksum(data)) throw new Error("백업 체크섬이 일치하지 않습니다.");
  const normalized = { ...data, bookmarks: (data.bookmarks as Array<Record<string, unknown>> | undefined) || [] } as Record<BackupTable, Array<Record<string, unknown>>>;
  normalized.folders = (normalized.folders || []).map((row) => ({ ...row, pinned: row.pinned ?? 0 }));
  normalized.study_sessions = (normalized.study_sessions || []).map((row) => ({ ...row, queue_json: row.queue_json ?? row.word_ids_json ?? "[]", loop_mode: row.loop_mode ?? 0, results_json: row.results_json ?? "[]" }));
  return { ...backup, format_version: "jlpt-owner-backup-v2", data: normalized } as { format_version: string; scope: "all" | "progress"; exported_at: string; dataset_revision: number; checksum: string; data: Record<BackupTable, Array<Record<string, unknown>>> };
}

function insertRows(db: AppDatabase, table: BackupTable, rows: Array<Record<string, unknown>>, replace: boolean) {
  const columns = tableColumns[table];
  for (const row of rows) {
    const verb = replace ? "INSERT OR REPLACE" : "INSERT OR IGNORE";
    db.prepare(`${verb} INTO ${table}(${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`).run(...columns.map((column) => row[column]));
  }
}

export function restoreBackup(db: AppDatabase, value: unknown, strategy: "merge" | "replace") {
  const backup = validateBackup(value); const timestamp = new Date().toISOString();
  return db.transaction(() => {
    db.pragma("defer_foreign_keys = ON");
    const changeSpecs = [
      { entityType: "folder", table: "folders", id: "id", revision: "revision", convert: folderFromRow },
      { entityType: "book", table: "books", id: "id", revision: "revision", convert: bookFromRow },
      { entityType: "entry", table: "book_entries", id: "entry_id", revision: "revision", convert: entryFromRow },
      { entityType: "studySession", table: "study_sessions", id: "id", revision: "revision", convert: studySessionFromRow },
      { entityType: "bookmark", table: "bookmarks", id: "entry_id", revision: "revision", convert: bookmarkFromRow },
    ] as const;
    const removed: Array<{ entityType: string; entityId: string; revision: number }> = [];
    if (strategy === "replace") {
      for (const spec of changeSpecs) {
        if (!backup.data[spec.table]) continue;
        const incoming = new Set(backup.data[spec.table].map((row) => String(row[spec.id])));
        const current = db.prepare(`SELECT ${spec.id} entity_id,${spec.revision} revision FROM ${spec.table}`).all() as Array<{ entity_id: string; revision: number }>;
        for (const row of current) if (!incoming.has(String(row.entity_id))) removed.push({ entityType: spec.entityType, entityId: String(row.entity_id), revision: Number(row.revision) + 1 });
      }
      for (const [entityType, table, idColumn, revisionColumn] of [["reviewState", "review_states", "word_id", null], ["preference", "preferences", "key", "revision"]] as const) {
        if (!backup.data[table]) continue;
        const incoming = new Set(backup.data[table].map((row) => String(row[idColumn])));
        const current = db.prepare(`SELECT ${idColumn} entity_id${revisionColumn ? `,${revisionColumn} revision` : ""} FROM ${table}`).all() as Array<{ entity_id: string; revision?: number }>;
        for (const row of current) if (!incoming.has(String(row.entity_id))) removed.push({ entityType, entityId: String(row.entity_id), revision: Number(row.revision || 0) + 1 });
      }
    }
    if (strategy === "replace") {
      for (const table of ["bookmarks", "review_events", "review_states", "study_sessions", "preferences"] as const) db.prepare(`DELETE FROM ${table}`).run();
      if (backup.scope === "all") for (const table of ["book_entries", "word_keys", "books", "folders"] as const) db.prepare(`DELETE FROM ${table}`).run();
    }
    const order: BackupTable[] = backup.scope === "all" ? ["folders", "books", "word_keys", "book_entries", "review_events", "review_states", "study_sessions", "bookmarks", "preferences"] : ["review_events", "review_states", "study_sessions", "bookmarks", "preferences"];
    for (const table of order) insertRows(db, table, backup.data[table], strategy === "replace");
    for (const item of removed) db.prepare("INSERT INTO sync_changes(entity_type,entity_id,revision,action,payload_json,changed_at) VALUES (?,?,?,'delete','{}',?)").run(item.entityType, item.entityId, item.revision, timestamp);
    for (const spec of changeSpecs) {
      if (!backup.data[spec.table]) continue;
      for (const row of backup.data[spec.table]) db.prepare("INSERT INTO sync_changes(entity_type,entity_id,revision,action,payload_json,changed_at) VALUES (?,?,?,?,?,?)").run(spec.entityType, row[spec.id], Number(row[spec.revision] || 1), row.deleted_at ? "delete" : "upsert", JSON.stringify(spec.convert(row)), timestamp);
    }
    for (const row of backup.data.review_states || []) {
      const state = { wordId: row.word_id, schedulerVersion: row.scheduler_version, state: JSON.parse(String(row.serialized_state_json)), dueAt: row.due_at, lastReviewedAt: row.last_reviewed_at, lastRating: row.last_rating, lapses: Number(row.lapses), repetitions: Number(row.repetitions), knownFlag: row.known_flag === null ? null : Boolean(row.known_flag) };
      db.prepare("INSERT INTO sync_changes(entity_type,entity_id,revision,action,payload_json,changed_at) VALUES ('reviewState',?,1,'upsert',?,?)").run(row.word_id, JSON.stringify(state), timestamp);
    }
    for (const row of backup.data.preferences || []) {
      const preference = JSON.parse(String(row.value_json));
      db.prepare("INSERT INTO sync_changes(entity_type,entity_id,revision,action,payload_json,changed_at) VALUES ('preference',?,?,'upsert',?,?)").run(row.key, Number(row.revision || 1), JSON.stringify(preference), timestamp);
    }
    return { status: "restored", scope: backup.scope, strategy, counts: Object.fromEntries(order.map((table) => [table, backup.data[table].length])) };
  })();
}
