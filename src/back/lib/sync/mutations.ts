import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { AppDatabase } from "@back/lib/db/database";
import { bookmarkFromRow, bookFromRow, entryFromRow, folderFromRow, studySessionFromRow } from "@back/lib/catalog/rows";
import { normalizeName } from "@back/lib/catalog/normalize";
import { initialRecord, schedule, type ReviewRecord } from "@back/lib/study/scheduler";

const operationSchema = z.object({
  operationId: z.string().uuid(),
  type: z.string().min(1).max(64),
  targetId: z.string().max(128).optional(),
  expectedRevision: z.number().int().positive().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.iso.datetime().optional(),
}).strict();

export const mutationBatchSchema = z.object({
  deviceId: z.string().trim().min(1).max(128),
  mutations: z.array(operationSchema).min(1).max(20),
}).strict();

const idSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/);
const nullableIdSchema = idSchema.nullable();
const nameSchema = z.string().trim().min(1).max(80);
const titleSchema = z.string().trim().min(1).max(160);
const optionalText = (max: number) => z.string().max(max).nullable().optional();
const stringArray = (maxItems = 50, maxLength = 200) => z.array(z.string().max(maxLength)).max(maxItems);
const entryFieldsSchema = z.object({
  term: z.string().trim().min(1).max(200),
  reading: optionalText(200),
  meanings: stringArray(50, 1_000),
  primaryMeaning: optionalText(1_000),
  nuance: optionalText(4_000),
  partOfSpeech: stringArray(),
  jlptLevels: z.array(z.enum(["N1", "N2", "N3", "N4", "N5"])).max(5).default([]),
  years: z.array(z.number().int().min(1900).max(2200)).max(100).default([]),
  categories: stringArray(),
  relatedTerms: stringArray(100),
  examples: z.array(z.object({ ja: z.string().max(4_000), ko: z.string().max(4_000).nullable().optional() })).max(100),
  sources: z.array(z.record(z.string(), z.unknown())).max(100),
  status: z.enum(["ready", "needs-review"]),
  tags: stringArray(),
}).superRefine((entry, context) => {
  if (entry.status === "ready" && entry.meanings.filter((meaning) => meaning.trim()).length === 0) {
    context.addIssue({ code: "custom", message: "정상 항목에는 뜻이 하나 이상 필요합니다.", path: ["meanings"] });
  }
});
const sessionPayloadSchema = z.object({
  id: idSchema,
  bookIds: z.array(idSchema).max(500),
  mode: z.enum(["all", "unseen", "due", "weak"]),
  includeReview: z.boolean(),
  wordIds: z.array(idSchema).max(10_000),
  position: z.number().int().nonnegative().default(0),
  revealed: z.boolean().default(false),
  ratings: z.record(z.string(), z.enum(["again", "hard", "good", "easy"])).default({}),
  queue: z.array(idSchema).max(10_000).default([]),
  loopMode: z.boolean().default(false),
  results: z.array(z.object({ wordId: idSchema, rating: z.enum(["again", "hard", "good", "easy"]), occurredAt: z.iso.datetime() })).max(50_000).default([]),
  status: z.enum(["active", "paused", "completed"]).default("active"),
});

type Operation = z.infer<typeof operationSchema>;
type MutationStatus = "applied" | "duplicate" | "conflict" | "rejected";

export interface MutationResult {
  operationId: string;
  status: MutationStatus;
  entity?: unknown;
  serverRevision?: number;
  error?: { code: string; message: string; details?: Record<string, unknown> };
}

class MutationFailure extends Error {
  constructor(public code: string, message: string, public entity?: unknown, public revision?: number, public details?: Record<string, unknown>) {
    super(message);
  }
}

function now() { return new Date().toISOString(); }

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

function fingerprint(operation: Operation) {
  return createHash("sha256").update(stableStringify(operation)).digest("hex");
}

function requiredTarget(operation: Operation) {
  return idSchema.parse(operation.targetId);
}

function checkRevision(expected: number | undefined, actual: number, entity: unknown) {
  if (expected === undefined) throw new MutationFailure("VALIDATION", "expectedRevision이 필요합니다.");
  if (expected !== actual) throw new MutationFailure("REVISION_CONFLICT", "다른 기기에서 먼저 변경되었습니다.", entity, actual);
}

function recordChange(db: AppDatabase, entityType: string, entityId: string, revision: number, action: "upsert" | "delete", payload: unknown) {
  db.prepare("INSERT INTO sync_changes(entity_type,entity_id,revision,action,payload_json,changed_at) VALUES (?,?,?,?,?,?)")
    .run(entityType, entityId, revision, action, JSON.stringify(payload), now());
}

function activeFolder(db: AppDatabase, id: string) {
  const row = db.prepare("SELECT * FROM folders WHERE id=? AND deleted_at IS NULL").get(id) as Record<string, unknown> | undefined;
  if (!row) throw new MutationFailure("NOT_FOUND", "폴더를 찾을 수 없습니다.");
  return row;
}

function activeBook(db: AppDatabase, id: string) {
  const row = db.prepare("SELECT * FROM books WHERE id=? AND deleted_at IS NULL").get(id) as Record<string, unknown> | undefined;
  if (!row) throw new MutationFailure("NOT_FOUND", "세트를 찾을 수 없습니다.");
  return row;
}

function activeEntry(db: AppDatabase, id: string) {
  const row = db.prepare("SELECT * FROM book_entries WHERE entry_id=? AND deleted_at IS NULL").get(id) as Record<string, unknown> | undefined;
  if (!row) throw new MutationFailure("NOT_FOUND", "단어 항목을 찾을 수 없습니다.");
  return row;
}

function assertFolderNameAvailable(db: AppDatabase, name: string, parentId: string | null, excludeId?: string) {
  const duplicate = db.prepare("SELECT id FROM folders WHERE COALESCE(parent_id,'')=COALESCE(?,'') AND name_normalized=? AND deleted_at IS NULL AND id<>COALESCE(?,'')")
    .get(parentId, normalizeName(name), excludeId || null);
  if (duplicate) throw new MutationFailure("DUPLICATE_NAME", "같은 위치에 동일한 이름의 폴더가 있습니다.");
}

function folderParentDepth(db: AppDatabase, parentId: string | null, movingId?: string) {
  let current = parentId;
  let depth = 0;
  const seen = new Set<string>();
  while (current) {
    if (current === movingId) throw new MutationFailure("FOLDER_CYCLE", "자기 자신이나 하위 폴더로 이동할 수 없습니다.");
    if (seen.has(current)) throw new MutationFailure("FOLDER_CYCLE", "폴더 계층에 순환이 있습니다.");
    seen.add(current);
    const row = activeFolder(db, current);
    current = row.parent_id === null ? null : String(row.parent_id);
    depth += 1;
  }
  return depth;
}

function subtreeHeight(db: AppDatabase, id: string) {
  const result = db.prepare(`WITH RECURSIVE descendants(id,depth) AS (
    SELECT id,1 FROM folders WHERE id=? AND deleted_at IS NULL
    UNION ALL SELECT f.id,d.depth+1 FROM folders f JOIN descendants d ON f.parent_id=d.id WHERE f.deleted_at IS NULL
  ) SELECT COALESCE(MAX(depth),1) height FROM descendants`).get(id) as { height: number };
  return Number(result.height);
}

function assertFolderPlacement(db: AppDatabase, parentId: string | null, movingId?: string) {
  const depth = folderParentDepth(db, parentId, movingId) + 1;
  const height = movingId ? subtreeHeight(db, movingId) : 1;
  if (depth + height - 1 > 5) throw new MutationFailure("FOLDER_DEPTH", "폴더는 최대 5단계까지 만들 수 있습니다.");
}

function touchBook(db: AppDatabase, bookId: string) {
  const changedAt = now();
  db.prepare("UPDATE books SET revision=revision+1,updated_at=? WHERE id=?").run(changedAt, bookId);
  const row = db.prepare("SELECT * FROM books WHERE id=?").get(bookId) as Record<string, unknown>;
  const entity = bookFromRow(row);
  recordChange(db, "book", bookId, Number(row.revision), "upsert", entity);
}

function shiftEntryPositions(db: AppDatabase, bookId: string, fromPosition: number, delta: 1 | -1) {
  const rows = db.prepare(`SELECT * FROM book_entries WHERE book_id=? AND deleted_at IS NULL AND position>=? ORDER BY position ${delta > 0 ? "DESC" : "ASC"}`).all(bookId, fromPosition) as Array<Record<string, unknown>>;
  for (const row of rows) {
    const position = Number(row.position) + delta;
    if (position < 0) continue;
    const updatedAt = now();
    db.prepare("UPDATE book_entries SET position=?,revision=revision+1,updated_at=? WHERE entry_id=?").run(position, updatedAt, row.entry_id);
    const updated = activeEntry(db, String(row.entry_id));
    recordChange(db, "entry", String(row.entry_id), Number(updated.revision), "upsert", entryFromRow(updated));
  }
}

function handleFolder(db: AppDatabase, operation: Operation) {
  if (operation.type === "folder.create") {
    const payload = z.object({ id: idSchema, name: nameSchema, parentId: nullableIdSchema.default(null), orderIndex: z.number().int().nonnegative().default(0) }).parse(operation.payload);
    if (db.prepare("SELECT 1 FROM folders WHERE id=?").get(payload.id)) throw new MutationFailure("ID_EXISTS", "이미 사용 중인 폴더 ID입니다.");
    assertFolderPlacement(db, payload.parentId);
    assertFolderNameAvailable(db, payload.name, payload.parentId);
    const timestamp = now();
    db.prepare("INSERT INTO folders(id,name,name_normalized,parent_id,order_index,revision,created_at,updated_at,deleted_at) VALUES (?,?,?,?,?,1,?,?,NULL)")
      .run(payload.id, payload.name.trim(), normalizeName(payload.name), payload.parentId, payload.orderIndex, timestamp, timestamp);
    const entity = folderFromRow(activeFolder(db, payload.id));
    recordChange(db, "folder", payload.id, 1, "upsert", entity);
    return entity;
  }
  const id = requiredTarget(operation);
  const row = activeFolder(db, id);
  const current = folderFromRow(row);
  checkRevision(operation.expectedRevision, Number(row.revision), current);
  if (operation.type === "folder.rename") {
    const payload = z.object({ name: nameSchema }).parse(operation.payload);
    const parentId = row.parent_id === null ? null : String(row.parent_id);
    assertFolderNameAvailable(db, payload.name, parentId, id);
    db.prepare("UPDATE folders SET name=?,name_normalized=?,revision=revision+1,updated_at=? WHERE id=?").run(payload.name.trim(), normalizeName(payload.name), now(), id);
  } else if (operation.type === "folder.pin") {
    const payload = z.object({ pinned: z.boolean() }).parse(operation.payload);
    db.prepare("UPDATE folders SET pinned=?,revision=revision+1,updated_at=? WHERE id=?").run(Number(payload.pinned), now(), id);
  } else if (operation.type === "folder.move") {
    const payload = z.object({ parentId: nullableIdSchema, orderIndex: z.number().int().nonnegative() }).parse(operation.payload);
    assertFolderPlacement(db, payload.parentId, id);
    assertFolderNameAvailable(db, String(row.name), payload.parentId, id);
    db.prepare("UPDATE folders SET parent_id=?,order_index=?,revision=revision+1,updated_at=? WHERE id=?").run(payload.parentId, payload.orderIndex, now(), id);
  } else if (operation.type === "folder.delete") {
    const payload = z.object({ policy: z.enum(["unfile-books", "trash-contents"]) }).parse(operation.payload);
    const timestamp = now();
    if (payload.policy === "unfile-books") {
      const books = db.prepare("SELECT * FROM books WHERE folder_id=? AND deleted_at IS NULL").all(id) as Array<Record<string, unknown>>;
      for (const book of books) {
        db.prepare("UPDATE books SET folder_id=NULL,revision=revision+1,updated_at=? WHERE id=?").run(timestamp, book.id);
        const updated = activeBook(db, String(book.id));
        recordChange(db, "book", String(book.id), Number(updated.revision), "upsert", bookFromRow(updated));
      }
      const children = db.prepare("SELECT * FROM folders WHERE parent_id=? AND deleted_at IS NULL").all(id) as Array<Record<string, unknown>>;
      for (const child of children) {
        db.prepare("UPDATE folders SET parent_id=NULL,revision=revision+1,updated_at=? WHERE id=?").run(timestamp, child.id);
        const updated = activeFolder(db, String(child.id));
        recordChange(db, "folder", String(child.id), Number(updated.revision), "upsert", folderFromRow(updated));
      }
      db.prepare("UPDATE folders SET revision=revision+1,updated_at=?,deleted_at=? WHERE id=?").run(timestamp, timestamp, id);
    } else {
      const descendants = db.prepare(`WITH RECURSIVE tree(id) AS (SELECT id FROM folders WHERE id=? UNION ALL SELECT f.id FROM folders f JOIN tree t ON f.parent_id=t.id WHERE f.deleted_at IS NULL) SELECT id FROM tree`).all(id) as Array<{ id: string }>;
      for (const folder of descendants.reverse()) {
        const books = db.prepare("SELECT * FROM books WHERE folder_id=? AND deleted_at IS NULL").all(folder.id) as Array<Record<string, unknown>>;
        for (const book of books) {
          db.prepare("UPDATE books SET revision=revision+1,updated_at=?,deleted_at=? WHERE id=?").run(timestamp, timestamp, book.id);
          const deleted = db.prepare("SELECT * FROM books WHERE id=?").get(book.id) as Record<string, unknown>;
          recordChange(db, "book", String(book.id), Number(deleted.revision), "delete", bookFromRow(deleted));
        }
        db.prepare("UPDATE folders SET revision=revision+1,updated_at=?,deleted_at=? WHERE id=?").run(timestamp, timestamp, folder.id);
        const deleted = db.prepare("SELECT * FROM folders WHERE id=?").get(folder.id) as Record<string, unknown>;
        recordChange(db, "folder", folder.id, Number(deleted.revision), "delete", folderFromRow(deleted));
      }
      return folderFromRow(db.prepare("SELECT * FROM folders WHERE id=?").get(id) as Record<string, unknown>);
    }
    const deleted = db.prepare("SELECT * FROM folders WHERE id=?").get(id) as Record<string, unknown>;
    const entity = folderFromRow(deleted);
    recordChange(db, "folder", id, Number(deleted.revision), "delete", entity);
    return entity;
  } else if (operation.type === "folder.restore") {
    throw new MutationFailure("NOT_FOUND", "복구 대상은 휴지통 API를 통해 복구해야 합니다.");
  } else {
    throw new MutationFailure("UNKNOWN_MUTATION", "지원하지 않는 폴더 변경입니다.");
  }
  const updated = activeFolder(db, id);
  const entity = folderFromRow(updated);
  recordChange(db, "folder", id, Number(updated.revision), "upsert", entity);
  return entity;
}

function handleFolderRestore(db: AppDatabase, operation: Operation) {
  const id = requiredTarget(operation);
  const row = db.prepare("SELECT * FROM folders WHERE id=? AND deleted_at IS NOT NULL").get(id) as Record<string, unknown> | undefined;
  if (!row) throw new MutationFailure("NOT_FOUND", "휴지통에서 폴더를 찾을 수 없습니다.");
  checkRevision(operation.expectedRevision, Number(row.revision), folderFromRow(row));
  const payload = z.object({ parentId: nullableIdSchema.default(null), orderIndex: z.number().int().nonnegative().default(0) }).parse(operation.payload);
  assertFolderPlacement(db, payload.parentId, id);
  assertFolderNameAvailable(db, String(row.name), payload.parentId, id);
  db.prepare("UPDATE folders SET parent_id=?,order_index=?,revision=revision+1,updated_at=?,deleted_at=NULL WHERE id=?").run(payload.parentId, payload.orderIndex, now(), id);
  const entity = folderFromRow(activeFolder(db, id));
  recordChange(db, "folder", id, entity.revision, "upsert", entity);
  return entity;
}

function handleBook(db: AppDatabase, operation: Operation) {
  if (operation.type === "book.create") {
    const payload = z.object({
      id: idSchema,
      title: titleSchema,
      folderId: nullableIdSchema.default(null),
      category: z.string().trim().max(100).nullable().default(null),
      orderIndex: z.number().int().nonnegative().default(0),
      origin: z.enum(["manual", "import"]).default("manual"),
      originRef: z.record(z.string(), z.unknown()).nullable().default(null),
    }).parse(operation.payload);
    if (!payload.id.startsWith("book-")) throw new MutationFailure("VALIDATION", "새 세트 ID는 book- 접두사를 사용해야 합니다.");
    if (db.prepare("SELECT 1 FROM books WHERE id=?").get(payload.id)) throw new MutationFailure("ID_EXISTS", "이미 사용 중인 세트 ID입니다.");
    if (payload.folderId) activeFolder(db, payload.folderId);
    const timestamp = now();
    db.prepare("INSERT INTO books(id,title,category,folder_id,favorite,order_index,origin,origin_ref,revision,created_at,updated_at,deleted_at) VALUES (?,?,?,?,0,?,?,?,?,?,?,NULL)")
      .run(payload.id, payload.title, payload.category, payload.folderId, payload.orderIndex, payload.origin, payload.originRef ? JSON.stringify(payload.originRef) : null, 1, timestamp, timestamp);
    const entity = bookFromRow(activeBook(db, payload.id));
    recordChange(db, "book", payload.id, 1, "upsert", entity);
    return entity;
  }
  const id = requiredTarget(operation);
  if (operation.type === "book.restore") {
    const row = db.prepare("SELECT * FROM books WHERE id=? AND deleted_at IS NOT NULL").get(id) as Record<string, unknown> | undefined;
    if (!row) throw new MutationFailure("NOT_FOUND", "휴지통에서 세트를 찾을 수 없습니다.");
    checkRevision(operation.expectedRevision, Number(row.revision), bookFromRow(row));
    const payload = z.object({ folderId: nullableIdSchema.optional() }).parse(operation.payload);
    const folderId = payload.folderId === undefined ? (row.folder_id === null ? null : String(row.folder_id)) : payload.folderId;
    if (folderId) activeFolder(db, folderId);
    db.prepare("UPDATE books SET folder_id=?,revision=revision+1,updated_at=?,deleted_at=NULL WHERE id=?").run(folderId, now(), id);
    const entity = bookFromRow(activeBook(db, id));
    recordChange(db, "book", id, entity.revision, "upsert", entity);
    return entity;
  }
  const row = activeBook(db, id);
  const current = bookFromRow(row);
  checkRevision(operation.expectedRevision, Number(row.revision), current);
  if (operation.type === "book.update") {
    const payload = z.object({ title: titleSchema.optional(), category: z.string().trim().max(100).nullable().optional(), favorite: z.boolean().optional() }).parse(operation.payload);
    if (payload.title === undefined && payload.category === undefined && payload.favorite === undefined) throw new MutationFailure("VALIDATION", "변경할 값을 입력해 주세요.");
    db.prepare("UPDATE books SET title=COALESCE(?,title),category=CASE WHEN ? THEN ? ELSE category END,favorite=COALESCE(?,favorite),revision=revision+1,updated_at=? WHERE id=?")
      .run(payload.title ?? null, payload.category !== undefined ? 1 : 0, payload.category ?? null, payload.favorite === undefined ? null : Number(payload.favorite), now(), id);
  } else if (operation.type === "book.move") {
    const payload = z.object({ folderId: nullableIdSchema, orderIndex: z.number().int().nonnegative() }).parse(operation.payload);
    if (payload.folderId) activeFolder(db, payload.folderId);
    db.prepare("UPDATE books SET folder_id=?,order_index=?,revision=revision+1,updated_at=? WHERE id=?").run(payload.folderId, payload.orderIndex, now(), id);
  } else if (operation.type === "book.delete") {
    const timestamp = now();
    db.prepare("UPDATE books SET revision=revision+1,updated_at=?,deleted_at=? WHERE id=?").run(timestamp, timestamp, id);
    const deleted = db.prepare("SELECT * FROM books WHERE id=?").get(id) as Record<string, unknown>;
    const entity = bookFromRow(deleted);
    recordChange(db, "book", id, Number(deleted.revision), "delete", entity);
    return entity;
  } else {
    throw new MutationFailure("UNKNOWN_MUTATION", "지원하지 않는 세트 변경입니다.");
  }
  const updated = activeBook(db, id);
  const entity = bookFromRow(updated);
  recordChange(db, "book", id, Number(updated.revision), "upsert", entity);
  return entity;
}

function handleBulkBooks(db: AppDatabase, operation: Operation) {
  const payload = z.object({ ids: z.array(idSchema).min(1).max(100), folderId: nullableIdSchema, expectedRevisions: z.record(z.string(), z.number().int().positive()) }).parse(operation.payload);
  if (payload.folderId) activeFolder(db, payload.folderId);
  const entities = [];
  for (const [index, id] of payload.ids.entries()) {
    const row = activeBook(db, id);
    checkRevision(payload.expectedRevisions[id], Number(row.revision), bookFromRow(row));
    db.prepare("UPDATE books SET folder_id=?,order_index=?,revision=revision+1,updated_at=? WHERE id=?").run(payload.folderId, index, now(), id);
    const updated = activeBook(db, id);
    const entity = bookFromRow(updated);
    recordChange(db, "book", id, Number(updated.revision), "upsert", entity);
    entities.push(entity);
  }
  return entities;
}

function entryValues(fields: z.infer<typeof entryFieldsSchema>) {
  return {
    term: fields.term,
    reading: fields.reading ?? null,
    meanings: JSON.stringify(fields.meanings),
    primaryMeaning: fields.primaryMeaning ?? null,
    nuance: fields.nuance ?? null,
    partOfSpeech: JSON.stringify(fields.partOfSpeech),
    jlptLevels: JSON.stringify(fields.jlptLevels),
    years: JSON.stringify(fields.years),
    categories: JSON.stringify(fields.categories),
    relatedTerms: JSON.stringify(fields.relatedTerms),
    examples: JSON.stringify(fields.examples),
    sources: JSON.stringify(fields.sources),
    status: fields.status,
    tags: JSON.stringify(fields.tags),
  };
}

function handleEntry(db: AppDatabase, operation: Operation) {
  if (operation.type === "entry.create") {
    const payload = z.object({ entryId: idSchema, bookId: idSchema, wordId: idSchema.optional(), position: z.number().int().nonnegative().optional(), fields: entryFieldsSchema }).parse(operation.payload);
    if (db.prepare("SELECT 1 FROM book_entries WHERE entry_id=?").get(payload.entryId)) throw new MutationFailure("ID_EXISTS", "이미 사용 중인 항목 ID입니다.");
    activeBook(db, payload.bookId);
    const wordId = payload.wordId || `word-${randomUUID()}`;
    if (!/^word-(?:[a-f0-9]{12}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(wordId)) throw new MutationFailure("VALIDATION", "단어 ID 형식이 올바르지 않습니다.");
    const count = Number((db.prepare("SELECT COUNT(*) value FROM book_entries WHERE book_id=? AND deleted_at IS NULL").get(payload.bookId) as { value: number }).value);
    const position = Math.min(payload.position ?? count, count);
    shiftEntryPositions(db, payload.bookId, position, 1);
    const timestamp = now();
    db.prepare("INSERT OR IGNORE INTO word_keys(word_id,created_at,retired_at) VALUES (?,?,NULL)").run(wordId, timestamp);
    const values = entryValues(payload.fields);
    db.prepare(`INSERT INTO book_entries(entry_id,book_id,word_id,position,term,reading,meanings_json,primary_meaning,nuance,part_of_speech_json,jlpt_levels_json,years_json,categories_json,related_terms_json,examples_json,sources_json,status,tags_json,revision,created_at,updated_at,deleted_at)
      VALUES (@entryId,@bookId,@wordId,@position,@term,@reading,@meanings,@primaryMeaning,@nuance,@partOfSpeech,@jlptLevels,@years,@categories,@relatedTerms,@examples,@sources,@status,@tags,1,@timestamp,@timestamp,NULL)`)
      .run({ ...values, entryId: payload.entryId, bookId: payload.bookId, wordId, position, timestamp });
    const entity = entryFromRow(activeEntry(db, payload.entryId));
    recordChange(db, "entry", payload.entryId, 1, "upsert", entity);
    touchBook(db, payload.bookId);
    return entity;
  }
  const id = requiredTarget(operation);
  if (operation.type === "entry.restore") {
    const row = db.prepare("SELECT * FROM book_entries WHERE entry_id=? AND deleted_at IS NOT NULL").get(id) as Record<string, unknown> | undefined;
    if (!row) throw new MutationFailure("NOT_FOUND", "휴지통에서 단어 항목을 찾을 수 없습니다.");
    checkRevision(operation.expectedRevision, Number(row.revision), entryFromRow(row));
    activeBook(db, String(row.book_id));
    const position = Number((db.prepare("SELECT COUNT(*) value FROM book_entries WHERE book_id=? AND deleted_at IS NULL").get(row.book_id) as { value: number }).value);
    db.prepare("UPDATE book_entries SET position=?,revision=revision+1,updated_at=?,deleted_at=NULL WHERE entry_id=?").run(position, now(), id);
    const entity = entryFromRow(activeEntry(db, id));
    recordChange(db, "entry", id, entity.revision, "upsert", entity);
    touchBook(db, entity.bookId);
    return entity;
  }
  const row = activeEntry(db, id);
  const current = entryFromRow(row);
  checkRevision(operation.expectedRevision, Number(row.revision), current);
  if (operation.type === "entry.update") {
    const payload = z.object({ fields: entryFieldsSchema, identityPolicy: z.enum(["same", "fork"]).default("fork") }).parse(operation.payload);
    const values = entryValues(payload.fields);
    let wordId = String(row.word_id);
    if (payload.identityPolicy === "fork") {
      wordId = `word-${randomUUID()}`;
      db.prepare("INSERT INTO word_keys(word_id,created_at,retired_at) VALUES (?,?,NULL)").run(wordId, now());
    }
    db.prepare(`UPDATE book_entries SET word_id=@wordId,term=@term,reading=@reading,meanings_json=@meanings,primary_meaning=@primaryMeaning,nuance=@nuance,part_of_speech_json=@partOfSpeech,jlpt_levels_json=@jlptLevels,years_json=@years,categories_json=@categories,related_terms_json=@relatedTerms,examples_json=@examples,sources_json=@sources,status=@status,tags_json=@tags,revision=revision+1,updated_at=@timestamp WHERE entry_id=@entryId`)
      .run({ ...values, wordId, timestamp: now(), entryId: id });
  } else if (operation.type === "entry.move") {
    const payload = z.object({ position: z.number().int().nonnegative() }).parse(operation.payload);
    const bookId = String(row.book_id);
    const all = db.prepare("SELECT entry_id,position FROM book_entries WHERE book_id=? AND deleted_at IS NULL ORDER BY position,entry_id").all(bookId) as Array<{ entry_id: string; position: number }>;
    const reordered = all.filter((item) => item.entry_id !== id);
    reordered.splice(Math.min(payload.position, reordered.length), 0, { entry_id: id, position: payload.position });
    db.prepare("UPDATE book_entries SET position=position+1000000 WHERE book_id=? AND deleted_at IS NULL").run(bookId);
    for (const [position, item] of reordered.entries()) {
      db.prepare("UPDATE book_entries SET position=?,revision=revision+1,updated_at=? WHERE entry_id=?").run(position, now(), item.entry_id);
      const updated = activeEntry(db, item.entry_id);
      recordChange(db, "entry", item.entry_id, Number(updated.revision), "upsert", entryFromRow(updated));
    }
    touchBook(db, bookId);
    return entryFromRow(activeEntry(db, id));
  } else if (operation.type === "entry.delete") {
    const timestamp = now();
    db.prepare("UPDATE book_entries SET revision=revision+1,updated_at=?,deleted_at=? WHERE entry_id=?").run(timestamp, timestamp, id);
    const deleted = db.prepare("SELECT * FROM book_entries WHERE entry_id=?").get(id) as Record<string, unknown>;
    const entity = entryFromRow(deleted);
    recordChange(db, "entry", id, Number(deleted.revision), "delete", entity);
    shiftEntryPositions(db, String(row.book_id), Number(row.position) + 1, -1);
    touchBook(db, String(row.book_id));
    return entity;
  } else {
    throw new MutationFailure("UNKNOWN_MUTATION", "지원하지 않는 단어 변경입니다.");
  }
  const updated = activeEntry(db, id);
  const entity = entryFromRow(updated);
  recordChange(db, "entry", id, Number(updated.revision), "upsert", entity);
  touchBook(db, String(updated.book_id));
  return entity;
}

function handleReview(db: AppDatabase, operation: Operation) {
  if (operation.type !== "review.rate") throw new MutationFailure("UNKNOWN_MUTATION", "지원하지 않는 복습 변경입니다.");
  const payload = z.object({
    wordId: idSchema,
    rating: z.enum(["again", "hard", "good", "easy"]),
    sessionId: idSchema.nullable().default(null),
    context: z.enum(["scheduled", "manual", "new"]),
  }).parse(operation.payload);
  if (!db.prepare("SELECT 1 FROM word_keys WHERE word_id=? AND retired_at IS NULL").get(payload.wordId)) throw new MutationFailure("NOT_FOUND", "학습할 단어를 찾을 수 없습니다.");
  const acceptedAt = new Date();
  const previousRow = db.prepare("SELECT serialized_state_json,scheduler_version FROM review_states WHERE word_id=?").get(payload.wordId) as { serialized_state_json: string; scheduler_version: string } | undefined;
  let previous: ReviewRecord | undefined;
  if (previousRow) {
    try { previous = JSON.parse(previousRow.serialized_state_json) as ReviewRecord; }
    catch { previous = initialRecord(payload.wordId); }
  }
  const next = schedule(previous ? { ...previous, wordId: payload.wordId } : initialRecord(payload.wordId), payload.rating, acceptedAt);
  const eventId = randomUUID();
  const occurredAt = operation.occurredAt || acceptedAt.toISOString();
  db.prepare("INSERT INTO review_events(event_id,operation_id,word_id,rating,occurred_at,accepted_at,session_id,review_context,scheduler_version) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(eventId, operation.operationId, payload.wordId, payload.rating, occurredAt, acceptedAt.toISOString(), payload.sessionId, payload.context, "sm2-v1");
  db.prepare(`INSERT INTO review_states(word_id,scheduler_version,serialized_state_json,due_at,last_reviewed_at,last_rating,lapses,repetitions,known_flag)
    VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(word_id) DO UPDATE SET scheduler_version=excluded.scheduler_version,serialized_state_json=excluded.serialized_state_json,due_at=excluded.due_at,last_reviewed_at=excluded.last_reviewed_at,last_rating=excluded.last_rating,lapses=excluded.lapses,repetitions=excluded.repetitions,known_flag=excluded.known_flag`)
    .run(payload.wordId, "sm2-v1", JSON.stringify(next), next.dueAt, next.lastReviewedAt, next.lastRating, next.lapses, next.repetitions, next.knownFlag === undefined ? null : Number(next.knownFlag));
  const entity = { wordId: payload.wordId, schedulerVersion: "sm2-v1", state: next, dueAt: next.dueAt, lastReviewedAt: next.lastReviewedAt, lastRating: next.lastRating, lapses: next.lapses, repetitions: next.repetitions, knownFlag: next.knownFlag ?? null };
  recordChange(db, "reviewState", payload.wordId, Number((db.prepare("SELECT COUNT(*) count FROM review_events WHERE word_id=?").get(payload.wordId) as { count: number }).count), "upsert", entity);
  return { eventId, operationId: operation.operationId, reviewState: entity };
}

function insertSession(db: AppDatabase, payload: z.infer<typeof sessionPayloadSchema>) {
  if (db.prepare("SELECT 1 FROM study_sessions WHERE id=?").get(payload.id)) throw new MutationFailure("ID_EXISTS", "이미 존재하는 학습 세션입니다.");
  const timestamp = now();
  db.prepare("INSERT INTO study_sessions(id,book_ids_json,mode,include_review,word_ids_json,position,revealed,ratings_json,queue_json,loop_mode,results_json,status,revision,updated_at,created_at,deleted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,NULL)")
    .run(payload.id, JSON.stringify(payload.bookIds), payload.mode, Number(payload.includeReview), JSON.stringify(payload.wordIds), payload.position, Number(payload.revealed), JSON.stringify(payload.ratings), JSON.stringify(payload.queue.length ? payload.queue : payload.wordIds), Number(payload.loopMode), JSON.stringify(payload.results), payload.status, timestamp, timestamp);
  const entity = studySessionFromRow(db.prepare("SELECT * FROM study_sessions WHERE id=?").get(payload.id) as Record<string, unknown>);
  recordChange(db, "studySession", payload.id, 1, "upsert", entity);
  return entity;
}

function handleSession(db: AppDatabase, operation: Operation) {
  if (operation.type === "session.create") return insertSession(db, sessionPayloadSchema.parse(operation.payload));
  const id = requiredTarget(operation);
  const row = db.prepare("SELECT * FROM study_sessions WHERE id=? AND deleted_at IS NULL").get(id) as Record<string, unknown> | undefined;
  if (!row) throw new MutationFailure("NOT_FOUND", "학습 세션을 찾을 수 없습니다.");
  const current = studySessionFromRow(row);
  checkRevision(operation.expectedRevision, Number(row.revision), current);
  if (operation.type === "session.restart") {
    const payload = sessionPayloadSchema.parse(operation.payload);
    const timestamp = now();
    db.prepare("UPDATE study_sessions SET status='completed',revision=revision+1,updated_at=? WHERE id=?").run(timestamp, id);
    const completed = studySessionFromRow(db.prepare("SELECT * FROM study_sessions WHERE id=?").get(id) as Record<string, unknown>);
    recordChange(db, "studySession", id, completed.revision, "upsert", completed);
    return insertSession(db, payload);
  }
  if (operation.type === "session.update") {
    const payload = z.object({ position: z.number().int().nonnegative().optional(), revealed: z.boolean().optional(), ratings: z.record(z.string(), z.enum(["again", "hard", "good", "easy"])).optional(), queue: z.array(idSchema).max(10_000).optional(), loopMode: z.boolean().optional(), results: z.array(z.object({ wordId: idSchema, rating: z.enum(["again", "hard", "good", "easy"]), occurredAt: z.iso.datetime() })).max(50_000).optional(), status: z.enum(["active", "paused", "completed"]).optional() }).parse(operation.payload);
    db.prepare("UPDATE study_sessions SET position=COALESCE(?,position),revealed=COALESCE(?,revealed),ratings_json=COALESCE(?,ratings_json),queue_json=COALESCE(?,queue_json),loop_mode=COALESCE(?,loop_mode),results_json=COALESCE(?,results_json),status=COALESCE(?,status),revision=revision+1,updated_at=? WHERE id=?")
      .run(payload.position ?? null, payload.revealed === undefined ? null : Number(payload.revealed), payload.ratings ? JSON.stringify(payload.ratings) : null, payload.queue ? JSON.stringify(payload.queue) : null, payload.loopMode === undefined ? null : Number(payload.loopMode), payload.results ? JSON.stringify(payload.results) : null, payload.status ?? null, now(), id);
  } else if (operation.type === "session.delete") {
    const timestamp = now(); db.prepare("UPDATE study_sessions SET revision=revision+1,updated_at=?,deleted_at=? WHERE id=?").run(timestamp, timestamp, id);
    const deleted = studySessionFromRow(db.prepare("SELECT * FROM study_sessions WHERE id=?").get(id) as Record<string, unknown>);
    recordChange(db, "studySession", id, deleted.revision, "delete", deleted); return deleted;
  } else throw new MutationFailure("UNKNOWN_MUTATION", "지원하지 않는 학습 세션 변경입니다.");
  const entity = studySessionFromRow(db.prepare("SELECT * FROM study_sessions WHERE id=?").get(id) as Record<string, unknown>);
  recordChange(db, "studySession", id, entity.revision, "upsert", entity);
  return entity;
}

function handleBookmark(db: AppDatabase, operation: Operation) {
  if (operation.type !== "bookmark.set") throw new MutationFailure("UNKNOWN_MUTATION", "지원하지 않는 북마크 변경입니다.");
  const payload = z.object({ entryId: idSchema, bookmarked: z.boolean() }).parse(operation.payload);
  activeEntry(db, payload.entryId);
  const row = db.prepare("SELECT * FROM bookmarks WHERE entry_id=?").get(payload.entryId) as Record<string, unknown> | undefined;
  if (payload.bookmarked) {
    if (row) {
      if (operation.expectedRevision !== undefined) checkRevision(operation.expectedRevision, Number(row.revision), bookmarkFromRow(row));
      return { ...bookmarkFromRow(row), bookmarked: true };
    }
    const timestamp = now();
    db.prepare("INSERT INTO bookmarks(entry_id,revision,created_at,updated_at) VALUES (?,1,?,?)").run(payload.entryId, timestamp, timestamp);
    const entity = { ...bookmarkFromRow(db.prepare("SELECT * FROM bookmarks WHERE entry_id=?").get(payload.entryId) as Record<string, unknown>), bookmarked: true };
    recordChange(db, "bookmark", payload.entryId, entity.revision, "upsert", entity);
    return entity;
  }
  if (!row) return { entryId: payload.entryId, bookmarked: false, revision: 0 };
  if (operation.expectedRevision !== undefined) checkRevision(operation.expectedRevision, Number(row.revision), { ...bookmarkFromRow(row), bookmarked: true });
  const revision = Number(row.revision) + 1;
  db.prepare("DELETE FROM bookmarks WHERE entry_id=?").run(payload.entryId);
  const entity = { entryId: payload.entryId, bookmarked: false, revision, updatedAt: now() };
  recordChange(db, "bookmark", payload.entryId, revision, "delete", entity);
  return entity;
}

function apply(db: AppDatabase, operation: Operation) {
  if (operation.type === "folder.restore") return handleFolderRestore(db, operation);
  if (operation.type.startsWith("folder.")) return handleFolder(db, operation);
  if (operation.type === "books.bulkMove") return handleBulkBooks(db, operation);
  if (operation.type.startsWith("book.")) return handleBook(db, operation);
  if (operation.type.startsWith("entry.")) return handleEntry(db, operation);
  if (operation.type.startsWith("review.")) return handleReview(db, operation);
  if (operation.type.startsWith("session.")) return handleSession(db, operation);
  if (operation.type.startsWith("bookmark.")) return handleBookmark(db, operation);
  throw new MutationFailure("UNKNOWN_MUTATION", "지원하지 않는 변경입니다.");
}

function saveOperation(db: AppDatabase, deviceId: string, operation: Operation, hash: string, result: MutationResult) {
  db.prepare("INSERT INTO client_operations(operation_id,device_id,operation_type,request_fingerprint,result_json,processed_at) VALUES (?,?,?,?,?,?)")
    .run(operation.operationId, deviceId, operation.type, hash, JSON.stringify(result), now());
}

export function applyMutation(db: AppDatabase, deviceId: string, raw: unknown): MutationResult {
  const parsed = operationSchema.safeParse(raw);
  if (!parsed.success) return { operationId: typeof (raw as { operationId?: unknown })?.operationId === "string" ? String((raw as { operationId: string }).operationId) : "invalid", status: "rejected", error: { code: "VALIDATION", message: "변경 요청 형식이 올바르지 않습니다." } };
  const operation = parsed.data;
  const hash = fingerprint(operation);
  const prior = db.prepare("SELECT request_fingerprint,result_json FROM client_operations WHERE operation_id=?").get(operation.operationId) as { request_fingerprint: string; result_json: string } | undefined;
  if (prior) {
    if (prior.request_fingerprint !== hash) return { operationId: operation.operationId, status: "rejected", error: { code: "OPERATION_ID_REUSED", message: "같은 operationId에 다른 내용이 사용되었습니다." } };
    const previous = JSON.parse(prior.result_json) as MutationResult;
    return { ...previous, status: "duplicate" };
  }
  try {
    return db.transaction(() => {
      const entity = apply(db, operation);
      const serverRevision = entity && !Array.isArray(entity) && typeof entity === "object" && "revision" in entity ? Number((entity as { revision: number }).revision) : undefined;
      const result: MutationResult = { operationId: operation.operationId, status: "applied", entity, ...(serverRevision ? { serverRevision } : {}) };
      saveOperation(db, deviceId, operation, hash, result);
      return result;
    })();
  } catch (error) {
    const failure = error instanceof MutationFailure
      ? error
      : new MutationFailure("REJECTED", error instanceof z.ZodError ? "입력값을 확인해 주세요." : "변경을 적용하지 못했습니다.");
    const result: MutationResult = {
      operationId: operation.operationId,
      status: failure.code === "REVISION_CONFLICT" ? "conflict" : "rejected",
      ...(failure.entity ? { entity: failure.entity } : {}),
      ...(failure.revision ? { serverRevision: failure.revision } : {}),
      error: { code: failure.code, message: failure.message, ...(failure.details ? { details: failure.details } : {}) },
    };
    try { saveOperation(db, deviceId, operation, hash, result); } catch { /* another request recorded it */ }
    return result;
  }
}

export function applyMutationBatch(db: AppDatabase, deviceId: string, mutations: unknown[]) {
  const results = mutations.map((mutation) => applyMutation(db, deviceId, mutation));
  const cursor = Number((db.prepare("SELECT COALESCE(MAX(seq),0) value FROM sync_changes").get() as { value: number }).value);
  return { results, cursor };
}
