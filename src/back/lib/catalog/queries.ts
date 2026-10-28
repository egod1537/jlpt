import type { AppDatabase } from "@back/lib/db/database";
import { bookFromRow, entryFromRow, folderFromRow, studySessionFromRow } from "@back/lib/catalog/rows";
import { normalizeSearch } from "@back/lib/catalog/normalize";

const BOOK_SELECT = `SELECT b.*,
  (SELECT COUNT(*) FROM book_entries e WHERE e.book_id=b.id AND e.deleted_at IS NULL) entry_count,
  (SELECT COUNT(DISTINCT e.word_id) FROM book_entries e JOIN review_states r ON r.word_id=e.word_id WHERE e.book_id=b.id AND e.deleted_at IS NULL AND r.last_reviewed_at IS NOT NULL) studied_count,
  (SELECT MAX(r.last_reviewed_at) FROM book_entries e JOIN review_states r ON r.word_id=e.word_id WHERE e.book_id=b.id AND e.deleted_at IS NULL) last_studied_at
  FROM books b`;

export function listFolders(db: AppDatabase) {
  const rows = db.prepare(`SELECT f.*,
    (SELECT COUNT(*) FROM books b WHERE b.folder_id=f.id AND b.deleted_at IS NULL) book_count,
    (SELECT COUNT(*) FROM folders c WHERE c.parent_id=f.id AND c.deleted_at IS NULL) child_count
    FROM folders f WHERE f.deleted_at IS NULL ORDER BY COALESCE(f.parent_id,''),f.order_index,f.name`).all() as Array<Record<string, unknown>>;
  return rows.map(folderFromRow);
}

export interface BookListOptions {
  folderId?: string | null;
  q?: string;
  sort?: "updated" | "name" | "created" | "studied" | "custom";
  favorite?: boolean;
  limit?: number;
  offset?: number;
}

export function listBooks(db: AppDatabase, options: BookListOptions = {}) {
  const clauses = ["b.deleted_at IS NULL"];
  const parameters: unknown[] = [];
  if (options.folderId !== undefined) {
    if (options.folderId === null) clauses.push("b.folder_id IS NULL");
    else { clauses.push("b.folder_id=?"); parameters.push(options.folderId); }
  }
  if (options.favorite) clauses.push("b.favorite=1");
  if (options.q) {
    clauses.push("(b.title LIKE ? ESCAPE '\\' OR COALESCE(b.category,'') LIKE ? ESCAPE '\\' OR b.id LIKE ? ESCAPE '\\' OR EXISTS (SELECT 1 FROM book_entries qe WHERE qe.book_id=b.id AND qe.deleted_at IS NULL AND qe.tags_json LIKE ? ESCAPE '\\'))");
    const like = `%${options.q.replace(/[\\%_]/g, "\\$&")}%`;
    parameters.push(like, like, like, like);
  }
  const orders = {
    updated: "b.updated_at DESC,b.id",
    name: "b.title COLLATE NOCASE,b.id",
    created: "b.created_at DESC,b.id",
    studied: "last_studied_at DESC,b.updated_at DESC,b.id",
    custom: "b.order_index,b.title COLLATE NOCASE,b.id",
  };
  const limit = Math.min(Math.max(options.limit || 50, 1), 500);
  const offset = Math.max(options.offset || 0, 0);
  const rows = db.prepare(`${BOOK_SELECT} WHERE ${clauses.join(" AND ")} ORDER BY ${orders[options.sort || "updated"]} LIMIT ? OFFSET ?`).all(...parameters, limit + 1, offset) as Array<Record<string, unknown>>;
  return { books: rows.slice(0, limit).map(bookFromRow), nextOffset: rows.length > limit ? offset + limit : null };
}

export function getBook(db: AppDatabase, id: string) {
  const row = db.prepare(`${BOOK_SELECT} WHERE b.id=? AND b.deleted_at IS NULL`).get(id) as Record<string, unknown> | undefined;
  return row ? bookFromRow(row) : null;
}

export function listEntries(db: AppDatabase, bookId: string, afterPosition = -1, limit = 100) {
  const pageSize = Math.min(Math.max(limit, 1), 200);
  const rows = db.prepare("SELECT * FROM book_entries WHERE book_id=? AND deleted_at IS NULL AND position>? ORDER BY position,entry_id LIMIT ?")
    .all(bookId, afterPosition, pageSize + 1) as Array<Record<string, unknown>>;
  const page = rows.slice(0, pageSize);
  return { entries: page.map(entryFromRow), nextCursor: rows.length > pageSize ? Number(page.at(-1)?.position) : null };
}

export function listTrash(db: AppDatabase) {
  const folders = (db.prepare("SELECT * FROM folders WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC").all() as Array<Record<string, unknown>>).map(folderFromRow);
  const books = (db.prepare(`${BOOK_SELECT} WHERE b.deleted_at IS NOT NULL ORDER BY b.deleted_at DESC`).all() as Array<Record<string, unknown>>).map(bookFromRow);
  const entries = (db.prepare("SELECT * FROM book_entries WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 500").all() as Array<Record<string, unknown>>).map(entryFromRow);
  return { folders, books, entries };
}

export function searchCatalog(db: AppDatabase, query: string, scope: "books" | "words", limit = 50, status?: "needs-review") {
  const needle = normalizeSearch(query);
  const max = Math.min(Math.max(limit, 1), 100);
  if (scope === "books") {
    const rows = db.prepare(`${BOOK_SELECT} WHERE b.deleted_at IS NULL ORDER BY b.updated_at DESC LIMIT 1000`).all() as Array<Record<string, unknown>>;
    return rows.map(bookFromRow).filter((book) => normalizeSearch(`${book.title} ${book.category || ""} ${book.id}`).includes(needle)).slice(0, max);
  }
  const rows = db.prepare("SELECT e.*,b.title book_title FROM book_entries e JOIN books b ON b.id=e.book_id WHERE e.deleted_at IS NULL AND b.deleted_at IS NULL ORDER BY e.updated_at DESC LIMIT 10000").all() as Array<Record<string, unknown>>;
  return rows.filter((row) => (!status || row.status === status) && (!needle || normalizeSearch(`${row.term} ${row.reading || ""} ${row.meanings_json} ${row.tags_json}`).includes(needle))).slice(0, max).map((row) => ({ ...entryFromRow(row), bookTitle: String(row.book_title) }));
}

export function bootstrap(db: AppDatabase) {
  return db.transaction(() => {
    const folders = listFolders(db);
    const books = listBooks(db, { limit: 500 }).books;
    const reviewStates = db.prepare("SELECT * FROM review_states").all().map((row) => {
      const value = row as Record<string, unknown>;
      return {
        wordId: value.word_id,
        schedulerVersion: value.scheduler_version,
        state: JSON.parse(String(value.serialized_state_json)),
        dueAt: value.due_at,
        lastReviewedAt: value.last_reviewed_at,
        lastRating: value.last_rating,
        lapses: value.lapses,
        repetitions: value.repetitions,
        knownFlag: value.known_flag === null ? null : Boolean(value.known_flag),
      };
    });
    const activeSessions = (db.prepare("SELECT * FROM study_sessions WHERE status IN ('active','paused') AND deleted_at IS NULL ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>).map(studySessionFromRow);
    const preferences = Object.fromEntries((db.prepare("SELECT key,value_json FROM preferences").all() as Array<{ key: string; value_json: string }>).map((row) => [row.key, JSON.parse(row.value_json)]));
    const cursor = Number((db.prepare("SELECT COALESCE(MAX(seq),0) value FROM sync_changes").get() as { value: number }).value);
    return { schemaVersion: 1, serverTime: new Date().toISOString(), cursor, folders, books, reviewStates, activeSessions, preferences };
  })();
}
