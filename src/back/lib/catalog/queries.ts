import type { AppDatabase } from "@back/lib/db/database";
import { bookmarkFromRow, bookFromRow, entryFromRow, folderFromRow, studySessionFromRow } from "@back/lib/catalog/rows";
import { normalizeSearch } from "@back/lib/catalog/normalize";

const BOOK_SELECT = `WITH entry_stats AS (
    SELECT e.book_id,COUNT(*) entry_count,
      COUNT(DISTINCT CASE WHEN r.last_reviewed_at IS NOT NULL THEN e.word_id END) studied_count,
      MAX(r.last_reviewed_at) last_studied_at
    FROM book_entries e LEFT JOIN review_states r ON r.word_id=e.word_id
    WHERE e.deleted_at IS NULL GROUP BY e.book_id
  ) SELECT b.*,COALESCE(s.entry_count,0) entry_count,COALESCE(s.studied_count,0) studied_count,s.last_studied_at
  FROM books b LEFT JOIN entry_stats s ON s.book_id=b.id`;

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
    clauses.push("normalize_search(b.title||' '||COALESCE(b.category,'')||' '||b.id||' '||COALESCE((SELECT GROUP_CONCAT(qe.tags_json,' ') FROM book_entries qe WHERE qe.book_id=b.id AND qe.deleted_at IS NULL),'')) LIKE ? ESCAPE '\\'");
    const like = `%${normalizeSearch(options.q).replace(/[\\%_]/g, "\\$&")}%`;
    parameters.push(like);
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
  const like = `%${needle.replace(/[\\%_]/g, "\\$&")}%`;
  if (scope === "books") {
    const rows = db.prepare(`${BOOK_SELECT} WHERE b.deleted_at IS NULL AND normalize_search(b.title||' '||COALESCE(b.category,'')||' '||b.id) LIKE ? ESCAPE '\\' ORDER BY b.updated_at DESC LIMIT ?`).all(like, max) as Array<Record<string, unknown>>;
    return rows.map(bookFromRow);
  }
  const statusClause = status ? " AND e.status=?" : "";
  const searchClause = needle ? " AND normalize_search(e.term||' '||COALESCE(e.reading,'')||' '||e.meanings_json||' '||e.tags_json) LIKE ? ESCAPE '\\'" : "";
  const parameters: unknown[] = [];
  if (status) parameters.push(status);
  if (needle) parameters.push(like);
  parameters.push(max);
  const rows = db.prepare(`SELECT e.*,b.title book_title FROM book_entries e JOIN books b ON b.id=e.book_id WHERE e.deleted_at IS NULL AND b.deleted_at IS NULL${statusClause}${searchClause} ORDER BY e.updated_at DESC LIMIT ?`).all(...parameters) as Array<Record<string, unknown>>;
  return rows.map((row) => ({ ...entryFromRow(row), bookTitle: String(row.book_title) }));
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
    const bookmarks = (db.prepare("SELECT * FROM bookmarks ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>).map((row) => ({ ...bookmarkFromRow(row), bookmarked: true }));
    const cursor = Number((db.prepare("SELECT COALESCE(MAX(seq),0) value FROM sync_changes").get() as { value: number }).value);
    return { schemaVersion: 2, serverTime: new Date().toISOString(), cursor, folders, books, reviewStates, activeSessions, bookmarks, preferences };
  })();
}
