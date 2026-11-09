import "server-only";

import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@back/lib/db/database";
import type { GrammarBookDetail, GrammarBookInput, GrammarBookRecord, GrammarExampleRecord, GrammarNoteInput, GrammarNoteRecord } from "@back/lib/grammar/types";

type Row = Record<string, unknown>;
type GrammarCode = "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "TOO_LARGE" | "INTERNAL";

const idPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export class GrammarFailure extends Error {
  constructor(readonly status: number, readonly code: GrammarCode, message: string) {
    super(message);
    this.name = "GrammarFailure";
  }
}

function now() { return new Date().toISOString(); }
function generatedId(prefix: string) { return `${prefix}-${randomUUID()}`; }
function text(value: unknown) { return String(value ?? ""); }
function nullableText(value: unknown) { return value === null || value === undefined ? null : String(value); }
function parseArray<T>(value: unknown): T[] { return JSON.parse(String(value || "[]")) as T[]; }

function checkedId(value: unknown, fallbackPrefix: string) {
  const result = value === undefined ? generatedId(fallbackPrefix) : String(value);
  if (!idPattern.test(result)) throw new GrammarFailure(400, "VALIDATION", "id 형식을 확인해 주세요.");
  return result;
}

function requiredText(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new GrammarFailure(400, "VALIDATION", `${label}을(를) 확인해 주세요.`);
  return value.trim();
}

function optionalText(value: unknown, label: string, max: number, fallback = "") {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || value.length > max) throw new GrammarFailure(400, "VALIDATION", `${label}을(를) 확인해 주세요.`);
  return value.trim();
}

function nullableInput(value: unknown, label: string, max: number, fallback: string | null = null) {
  if (value === undefined) return fallback;
  if (value === null) return null;
  if (typeof value !== "string" || value.length > max) throw new GrammarFailure(400, "VALIDATION", `${label}을(를) 확인해 주세요.`);
  return value.trim() || null;
}

function integer(value: unknown, fallback: number) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 1_000_000) throw new GrammarFailure(400, "VALIDATION", "순서를 확인해 주세요.");
  return Number(value);
}

function revision(value: unknown) {
  if (!Number.isInteger(value) || Number(value) < 1) throw new GrammarFailure(400, "VALIDATION", "revision을 확인해 주세요.");
  return Number(value);
}

function stringArray(value: unknown, label: string, maxItems: number, maxLength: number, fallback: string[] = []) {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => typeof item !== "string" || !item.trim() || item.length > maxLength)) {
    throw new GrammarFailure(400, "VALIDATION", `${label}을(를) 확인해 주세요.`);
  }
  return value.map((item) => item.trim());
}

function examples(value: unknown, fallback: GrammarExampleRecord[] = []) {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.length > 100) throw new GrammarFailure(400, "VALIDATION", "예문을 확인해 주세요.");
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new GrammarFailure(400, "VALIDATION", "예문을 확인해 주세요.");
    const record = item as Record<string, unknown>;
    return {
      japanese: requiredText(record.japanese, "일본어 예문", 5_000),
      korean: optionalText(record.korean, "한국어 예문", 5_000),
    };
  });
}

function bookFrom(row: Row): GrammarBookRecord {
  return {
    id: text(row.id), title: text(row.title), description: text(row.description), level: text(row.level),
    type: text(row.type) as GrammarBookRecord["type"], markdown: nullableText(row.markdown), sourceFile: nullableText(row.source_file),
    sortOrder: Number(row.sort_order), sourceKind: text(row.source_kind) as GrammarBookRecord["sourceKind"], revision: Number(row.revision),
    noteCount: Number(row.note_count ?? 0), createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  };
}

function noteFrom(row: Row): GrammarNoteRecord {
  return {
    id: text(row.id), bookId: text(row.book_id), position: Number(row.position), pattern: text(row.pattern), reading: text(row.reading),
    meaning: text(row.meaning), connection: parseArray<string>(row.connection_json), explanation: text(row.explanation), caution: nullableText(row.caution),
    examples: parseArray<GrammarExampleRecord>(row.examples_json), keywords: parseArray<string>(row.keywords_json), notesMarkdown: nullableText(row.notes_markdown),
    sourceFile: nullableText(row.source_file), sourceKind: text(row.source_kind) as GrammarNoteRecord["sourceKind"], revision: Number(row.revision),
    createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  };
}

const bookSelect = `SELECT b.*,(SELECT COUNT(*) FROM grammar_notes n WHERE n.book_id=b.id AND n.deleted_at IS NULL) note_count FROM grammar_books b`;

export function listGrammarBooks(db: AppDatabase, options: { q?: string; type?: "book" | "flashcard"; limit?: number; offset?: number } = {}) {
  const limit = Math.min(500, Math.max(1, options.limit ?? 50));
  const offset = Math.max(0, options.offset ?? 0);
  const where = ["b.deleted_at IS NULL"];
  const parameters: unknown[] = [];
  if (options.q?.trim()) {
    const like = `%${options.q.trim().slice(0, 200).replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    where.push("(b.title LIKE ? ESCAPE '\\' OR b.description LIKE ? ESCAPE '\\')"); parameters.push(like, like);
  }
  if (options.type) { where.push("b.type=?"); parameters.push(options.type); }
  const rows = db.prepare(`${bookSelect} WHERE ${where.join(" AND ")} ORDER BY b.sort_order,b.title COLLATE NOCASE,b.id LIMIT ? OFFSET ?`).all(...parameters, limit + 1, offset) as Row[];
  return { books: rows.slice(0, limit).map(bookFrom), nextOffset: rows.length > limit ? offset + limit : null };
}

export function getGrammarBook(db: AppDatabase, bookId: string): GrammarBookDetail {
  const row = db.prepare(`${bookSelect} WHERE b.id=? AND b.deleted_at IS NULL`).get(bookId) as Row | undefined;
  if (!row) throw new GrammarFailure(404, "NOT_FOUND", "문법 단어장을 찾을 수 없습니다.");
  const notes = db.prepare("SELECT * FROM grammar_notes WHERE book_id=? AND deleted_at IS NULL ORDER BY position,id").all(bookId).map((item) => noteFrom(item as Row));
  return { ...bookFrom(row), notes };
}

function insertNote(db: AppDatabase, bookId: string, input: GrammarNoteInput, sourceKind: "builtin" | "manual", timestamp: string, ignore = false) {
  const noteId = checkedId(input.id, "grammar-note");
  const statement = `${ignore ? "INSERT OR IGNORE" : "INSERT"} INTO grammar_notes(
    book_id,id,position,pattern,reading,meaning,connection_json,explanation,caution,examples_json,keywords_json,notes_markdown,source_file,source_kind,revision,created_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`;
  try {
    db.prepare(statement).run(
      bookId, noteId, integer(input.position, 0), requiredText(input.pattern, "문형", 500), optionalText(input.reading, "읽기", 500),
      optionalText(input.meaning, "의미", 2_000), JSON.stringify(stringArray(input.connection, "접속", 50, 500)), optionalText(input.explanation, "설명", 20_000),
      nullableInput(input.caution, "주의", 10_000), JSON.stringify(examples(input.examples)), JSON.stringify(stringArray(input.keywords, "키워드", 50, 100)),
      nullableInput(input.notesMarkdown, "노트 Markdown", 524_288), nullableInput(input.sourceFile, "원본 파일", 500), sourceKind, timestamp, timestamp,
    );
  } catch (error) {
    if (error instanceof GrammarFailure) throw error;
    throw new GrammarFailure(409, "CONFLICT", "같은 id의 문법 노트가 이미 있습니다.");
  }
  return noteId;
}

export function createGrammarBook(db: AppDatabase, input: GrammarBookInput) {
  const bookId = checkedId(input.id, "grammar-book");
  const timestamp = now();
  const bookType = input.type ?? "book";
  if (!new Set(["book", "flashcard"]).has(bookType)) throw new GrammarFailure(400, "VALIDATION", "문법 단어장 유형을 확인해 주세요.");
  if ((input.notes?.length ?? 0) > 1_000) throw new GrammarFailure(400, "TOO_LARGE", "문법 노트는 한 번에 1,000개까지 추가할 수 있습니다.");
  const transaction = db.transaction(() => {
    try {
      db.prepare(`INSERT INTO grammar_books(id,title,description,level,type,markdown,source_file,sort_order,source_kind,revision,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?, 'manual',1,?,?)`).run(
        bookId, requiredText(input.title, "제목", 200), optionalText(input.description, "설명", 4_000), optionalText(input.level, "급수", 20, "N1") || "N1",
        bookType, nullableInput(input.markdown, "Markdown", 2_097_152), nullableInput(input.sourceFile, "원본 파일", 500), integer(input.sortOrder, 0), timestamp, timestamp,
      );
    } catch (error) {
      if (error instanceof GrammarFailure) throw error;
      throw new GrammarFailure(409, "CONFLICT", "같은 id의 문법 단어장이 이미 있습니다.");
    }
    for (const [index, note] of (input.notes ?? []).entries()) insertNote(db, bookId, { ...note, position: note.position ?? index }, "manual", timestamp);
  });
  transaction();
  return getGrammarBook(db, bookId);
}

export function updateGrammarBook(db: AppDatabase, bookId: string, input: Partial<GrammarBookInput> & { revision: number }) {
  const current = getGrammarBook(db, bookId);
  const expected = revision(input.revision);
  if (current.revision !== expected) throw new GrammarFailure(409, "CONFLICT", "문법 단어장이 다른 곳에서 수정되었습니다.");
  const type = input.type ?? current.type;
  if (!new Set(["book", "flashcard"]).has(type)) throw new GrammarFailure(400, "VALIDATION", "문법 단어장 유형을 확인해 주세요.");
  const timestamp = now();
  const result = db.prepare(`UPDATE grammar_books SET title=?,description=?,level=?,type=?,markdown=?,source_file=?,sort_order=?,revision=revision+1,updated_at=?
    WHERE id=? AND revision=? AND deleted_at IS NULL`).run(
    input.title === undefined ? current.title : requiredText(input.title, "제목", 200),
    input.description === undefined ? current.description : optionalText(input.description, "설명", 4_000),
    input.level === undefined ? current.level : optionalText(input.level, "급수", 20) || "N1",
    type, input.markdown === undefined ? current.markdown : nullableInput(input.markdown, "Markdown", 2_097_152),
    input.sourceFile === undefined ? current.sourceFile : nullableInput(input.sourceFile, "원본 파일", 500),
    input.sortOrder === undefined ? current.sortOrder : integer(input.sortOrder, current.sortOrder), timestamp, bookId, expected,
  );
  if (!result.changes) throw new GrammarFailure(409, "CONFLICT", "문법 단어장이 다른 곳에서 수정되었습니다.");
  return getGrammarBook(db, bookId);
}

export function deleteGrammarBook(db: AppDatabase, bookId: string, expectedRevision: number) {
  const expected = revision(expectedRevision); const timestamp = now();
  const transaction = db.transaction(() => {
    const result = db.prepare("UPDATE grammar_books SET deleted_at=?,updated_at=?,revision=revision+1 WHERE id=? AND revision=? AND deleted_at IS NULL").run(timestamp, timestamp, bookId, expected);
    if (!result.changes) throw new GrammarFailure(409, "CONFLICT", "문법 단어장을 찾을 수 없거나 revision이 다릅니다.");
    db.prepare("UPDATE grammar_notes SET deleted_at=?,updated_at=?,revision=revision+1 WHERE book_id=? AND deleted_at IS NULL").run(timestamp, timestamp, bookId);
  });
  transaction();
}

export function listGrammarNotes(db: AppDatabase, bookId: string, options: { q?: string; limit?: number; offset?: number } = {}) {
  getGrammarBook(db, bookId);
  const limit = Math.min(500, Math.max(1, options.limit ?? 100)); const offset = Math.max(0, options.offset ?? 0);
  const where = ["book_id=?", "deleted_at IS NULL"]; const parameters: unknown[] = [bookId];
  if (options.q?.trim()) { const like = `%${options.q.trim().slice(0, 200).replaceAll("%", "\\%").replaceAll("_", "\\_")}%`; where.push("(pattern LIKE ? ESCAPE '\\' OR meaning LIKE ? ESCAPE '\\' OR explanation LIKE ? ESCAPE '\\')"); parameters.push(like, like, like); }
  const rows = db.prepare(`SELECT * FROM grammar_notes WHERE ${where.join(" AND ")} ORDER BY position,id LIMIT ? OFFSET ?`).all(...parameters, limit + 1, offset) as Row[];
  return { notes: rows.slice(0, limit).map(noteFrom), nextOffset: rows.length > limit ? offset + limit : null };
}

export function getGrammarNote(db: AppDatabase, bookId: string, noteId: string) {
  const row = db.prepare("SELECT * FROM grammar_notes WHERE book_id=? AND id=? AND deleted_at IS NULL").get(bookId, noteId) as Row | undefined;
  if (!row) throw new GrammarFailure(404, "NOT_FOUND", "문법 노트를 찾을 수 없습니다.");
  return noteFrom(row);
}

export function createGrammarNote(db: AppDatabase, bookId: string, input: GrammarNoteInput) {
  getGrammarBook(db, bookId);
  const position = input.position ?? Number((db.prepare("SELECT COALESCE(MAX(position),-1)+1 value FROM grammar_notes WHERE book_id=? AND deleted_at IS NULL").get(bookId) as { value: number }).value);
  const noteId = insertNote(db, bookId, { ...input, position }, "manual", now());
  return getGrammarNote(db, bookId, noteId);
}

export function updateGrammarNote(db: AppDatabase, bookId: string, noteId: string, input: Partial<GrammarNoteInput> & { revision: number }) {
  const current = getGrammarNote(db, bookId, noteId); const expected = revision(input.revision);
  if (current.revision !== expected) throw new GrammarFailure(409, "CONFLICT", "문법 노트가 다른 곳에서 수정되었습니다.");
  const timestamp = now();
  const result = db.prepare(`UPDATE grammar_notes SET position=?,pattern=?,reading=?,meaning=?,connection_json=?,explanation=?,caution=?,examples_json=?,keywords_json=?,notes_markdown=?,source_file=?,revision=revision+1,updated_at=?
    WHERE book_id=? AND id=? AND revision=? AND deleted_at IS NULL`).run(
    input.position === undefined ? current.position : integer(input.position, current.position),
    input.pattern === undefined ? current.pattern : requiredText(input.pattern, "문형", 500),
    input.reading === undefined ? current.reading : optionalText(input.reading, "읽기", 500),
    input.meaning === undefined ? current.meaning : optionalText(input.meaning, "의미", 2_000),
    JSON.stringify(input.connection === undefined ? current.connection : stringArray(input.connection, "접속", 50, 500)),
    input.explanation === undefined ? current.explanation : optionalText(input.explanation, "설명", 20_000),
    input.caution === undefined ? current.caution : nullableInput(input.caution, "주의", 10_000),
    JSON.stringify(input.examples === undefined ? current.examples : examples(input.examples)),
    JSON.stringify(input.keywords === undefined ? current.keywords : stringArray(input.keywords, "키워드", 50, 100)),
    input.notesMarkdown === undefined ? current.notesMarkdown : nullableInput(input.notesMarkdown, "노트 Markdown", 524_288),
    input.sourceFile === undefined ? current.sourceFile : nullableInput(input.sourceFile, "원본 파일", 500),
    timestamp, bookId, noteId, expected,
  );
  if (!result.changes) throw new GrammarFailure(409, "CONFLICT", "문법 노트가 다른 곳에서 수정되었습니다.");
  return getGrammarNote(db, bookId, noteId);
}

export function deleteGrammarNote(db: AppDatabase, bookId: string, noteId: string, expectedRevision: number) {
  const expected = revision(expectedRevision); const timestamp = now();
  const result = db.prepare("UPDATE grammar_notes SET deleted_at=?,updated_at=?,revision=revision+1 WHERE book_id=? AND id=? AND revision=? AND deleted_at IS NULL").run(timestamp, timestamp, bookId, noteId, expected);
  if (!result.changes) throw new GrammarFailure(409, "CONFLICT", "문법 노트를 찾을 수 없거나 revision이 다릅니다.");
}

export function seedGrammarCatalog(db: AppDatabase, version: string, books: Array<GrammarBookInput & { sourceKind: "builtin" }>) {
  const current = db.prepare("SELECT value FROM grammar_catalog_state WHERE key='builtin-version'").get() as { value: string } | undefined;
  if (current?.value === version) return;
  const timestamp = now();
  const transaction = db.transaction(() => {
    for (const input of books) {
      const bookId = checkedId(input.id, "grammar-book"); const type = input.type ?? "book";
      db.prepare(`INSERT OR IGNORE INTO grammar_books(id,title,description,level,type,markdown,source_file,sort_order,source_kind,revision,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?, 'builtin',1,?,?)`).run(
        bookId, requiredText(input.title, "제목", 200), optionalText(input.description, "설명", 4_000), optionalText(input.level, "급수", 20, "N1"),
        type, nullableInput(input.markdown, "Markdown", 2_097_152), nullableInput(input.sourceFile, "원본 파일", 500), integer(input.sortOrder, 0), timestamp, timestamp,
      );
      for (const [index, note] of (input.notes ?? []).entries()) insertNote(db, bookId, { ...note, position: note.position ?? index }, "builtin", timestamp, true);
    }
    db.prepare("INSERT INTO grammar_catalog_state(key,value,updated_at) VALUES ('builtin-version',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(version, timestamp);
  });
  transaction();
}
