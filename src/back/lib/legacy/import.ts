import { createHash } from "node:crypto";
import { z } from "zod";
import type { AppDatabase } from "@back/lib/db/database";

const rating = z.enum(["again", "hard", "good", "easy"]);
const recordSchema = z.object({
  wordId: z.string().regex(/^word-[a-f0-9]{12}$/), repetitions: z.number().int().nonnegative(), intervalDays: z.number().int().nonnegative(), easeFactor: z.number().min(1.3).max(3),
  dueAt: z.iso.datetime().nullable(), lastReviewedAt: z.iso.datetime().nullable(), lastRating: rating.nullable(), lapses: z.number().int().nonnegative(), knownFlag: z.boolean().optional(),
}).strict();
const progressSchema = z.object({ schemaVersion: z.literal(1), updatedAt: z.iso.datetime(), records: z.record(z.string(), recordSchema) }).strict();
const sessionSchema = z.object({ schemaVersion: z.literal(1), updatedAt: z.iso.datetime(), books: z.array(z.string()).max(100), mode: z.enum(["all", "unseen", "due"]), includeReview: z.boolean(), wordIds: z.array(z.string()).max(10_000), position: z.number().int().nonnegative(), revealed: z.boolean(), ratings: z.record(z.string(), rating) }).strict();
export const legacyPayloadSchema = z.object({ progress: progressSchema, session: sessionSchema.nullable().optional() }).strict();

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function legacyHash(input: z.infer<typeof legacyPayloadSchema>) { return createHash("sha256").update(stable(input)).digest("hex"); }

export function previewLegacy(db: AppDatabase, raw: unknown) {
  const input = legacyPayloadSchema.parse(raw); const ids = Object.keys(input.progress.records);
  const valid = new Set((db.prepare(`SELECT word_id FROM word_keys WHERE word_id IN (${ids.length ? ids.map(() => "?").join(",") : "''"})`).all(...ids) as Array<{ word_id: string }>).map((row) => row.word_id));
  const states = new Map((db.prepare("SELECT word_id,last_reviewed_at FROM review_states").all() as Array<{ word_id: string; last_reviewed_at: string | null }>).map((row) => [row.word_id, row.last_reviewed_at]));
  let newerLocal = 0; let newerServer = 0; let conflicts = 0;
  ids.filter((id) => valid.has(id) && states.has(id)).forEach((id) => {
    const local = input.progress.records[id].lastReviewedAt; const server = states.get(id);
    if (local && (!server || local > server)) newerLocal += 1; else if (server && (!local || server > local)) newerServer += 1; else conflicts += 1;
  });
  const sessionBooks = input.session?.books || []; const validBooks = new Set((db.prepare(`SELECT id FROM books WHERE deleted_at IS NULL${sessionBooks.length ? ` AND id IN (${sessionBooks.map(() => "?").join(",")})` : " AND 0"}`).all(...sessionBooks) as Array<{ id: string }>).map((row) => row.id));
  return {
    hash: legacyHash(input), localRecords: ids.length, validRecords: ids.filter((id) => valid.has(id)).length, invalidWordIds: ids.filter((id) => !valid.has(id)).slice(0, 500),
    serverRecords: states.size, overlap: ids.filter((id) => states.has(id)).length, newerLocal, newerServer, conflicts,
    session: input.session ? { validBooks: sessionBooks.filter((id) => validBooks.has(id)), missingBooks: sessionBooks.filter((id) => !validBooks.has(id)), validWords: input.session.wordIds.filter((id) => valid.has(id)).length, missingWords: input.session.wordIds.filter((id) => !valid.has(id)).length } : null,
  };
}

export function importLegacy(db: AppDatabase, raw: unknown, strategy: "merge" | "replace") {
  const input = legacyPayloadSchema.parse(raw); const hash = legacyHash(input);
  const prior = db.prepare("SELECT summary_json FROM legacy_imports WHERE source_hash=?").get(hash) as { summary_json: string } | undefined;
  if (prior) return { ...JSON.parse(prior.summary_json), status: "duplicate" };
  const preview = previewLegacy(db, input); const recordIds = Object.keys(input.progress.records);
  const valid = new Set((db.prepare(`SELECT word_id FROM word_keys WHERE word_id IN (${recordIds.length ? recordIds.map(() => "?").join(",") : "''"})`).all(...recordIds) as Array<{ word_id: string }>).map((row) => row.word_id));
  let imported = 0; let skipped = 0; const changedAt = new Date().toISOString();
  return db.transaction(() => {
    if (strategy === "replace") db.prepare("DELETE FROM review_states").run();
    for (const [wordId, record] of Object.entries(input.progress.records)) {
      if (!valid.has(wordId)) { skipped += 1; continue; }
      const server = db.prepare("SELECT last_reviewed_at FROM review_states WHERE word_id=?").get(wordId) as { last_reviewed_at: string | null } | undefined;
      if (strategy === "merge" && server && (!record.lastReviewedAt || (server.last_reviewed_at && server.last_reviewed_at >= record.lastReviewedAt))) { skipped += 1; continue; }
      db.prepare(`INSERT INTO review_states(word_id,scheduler_version,serialized_state_json,due_at,last_reviewed_at,last_rating,lapses,repetitions,known_flag) VALUES (?,'legacy-v1',?,?,?,?,?,?,?)
        ON CONFLICT(word_id) DO UPDATE SET scheduler_version='legacy-v1',serialized_state_json=excluded.serialized_state_json,due_at=excluded.due_at,last_reviewed_at=excluded.last_reviewed_at,last_rating=excluded.last_rating,lapses=excluded.lapses,repetitions=excluded.repetitions,known_flag=excluded.known_flag`)
        .run(wordId, JSON.stringify(record), record.dueAt, record.lastReviewedAt, record.lastRating, record.lapses, record.repetitions, record.knownFlag === undefined ? null : Number(record.knownFlag));
      const entity = { wordId, schedulerVersion: "legacy-v1", state: record, dueAt: record.dueAt, lastReviewedAt: record.lastReviewedAt, lastRating: record.lastRating, lapses: record.lapses, repetitions: record.repetitions, knownFlag: record.knownFlag ?? null };
      db.prepare("INSERT INTO sync_changes(entity_type,entity_id,revision,action,payload_json,changed_at) VALUES ('reviewState',?,1,'upsert',?,?)").run(wordId, JSON.stringify(entity), changedAt);
      imported += 1;
    }
    let sessionImported = false;
    if (input.session) {
      const books = new Set((db.prepare("SELECT id FROM books WHERE deleted_at IS NULL").all() as Array<{ id: string }>).map((row) => row.id));
      const wordIds = input.session.wordIds.filter((id) => valid.has(id)); const position = Math.min(input.session.position, Math.max(0, wordIds.length - 1)); const id = `legacy-${hash.slice(0, 24)}`;
      db.prepare("INSERT INTO study_sessions(id,book_ids_json,mode,include_review,word_ids_json,position,revealed,ratings_json,status,revision,updated_at,created_at,deleted_at) VALUES (?,?,?,?,?,?,?,?, 'paused',1,?,?,NULL)")
        .run(id, JSON.stringify(input.session.books.filter((book) => books.has(book))), input.session.mode, Number(input.session.includeReview), JSON.stringify(wordIds), position, Number(input.session.revealed), JSON.stringify(input.session.ratings), changedAt, changedAt);
      sessionImported = true;
    }
    const summary = { status: "imported", strategy, imported, skipped, invalid: preview.invalidWordIds.length, sessionImported, sourceHash: hash };
    db.prepare("INSERT INTO legacy_imports(import_id,source_hash,summary_json,imported_at) VALUES (?,?,?,?)").run(`legacy-${hash.slice(0, 24)}`, hash, JSON.stringify(summary), changedAt);
    return summary;
  })();
}
