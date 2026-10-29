import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { AppDatabase } from "@back/lib/db/database";
import { getBook } from "@back/lib/catalog/queries";
import { applyMutation, type MutationResult } from "@back/lib/sync/mutations";

const idSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/);
const wordIdSchema = z.string().regex(/^word-(?:[a-f0-9]{12}|[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
const optionalText = (max: number) => z.string().max(max).nullable().optional();
const stringArray = (maxItems = 50, maxLength = 200) => z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).default([]);

export const externalWordSchema = z.object({
  entryId: idSchema.optional(),
  wordId: wordIdSchema.optional(),
  term: z.string().trim().min(1).max(200),
  reading: optionalText(200),
  meanings: z.array(z.string().trim().min(1).max(1_000)).max(50).default([]),
  primaryMeaning: optionalText(1_000),
  nuance: optionalText(4_000),
  partOfSpeech: stringArray(),
  jlptLevels: z.array(z.enum(["N1", "N2", "N3", "N4", "N5"])).max(5).default([]),
  years: z.array(z.number().int().min(1900).max(2200)).max(100).default([]),
  categories: stringArray(),
  relatedTerms: stringArray(100),
  examples: z.array(z.object({
    ja: z.string().trim().min(1).max(4_000),
    ko: z.string().max(4_000).nullable().optional(),
  }).strict()).max(1).default([]),
  sources: z.array(z.record(z.string(), z.unknown())).max(100).default([]),
  status: z.enum(["ready", "needs-review"]).default("ready"),
  tags: stringArray(),
}).strict().superRefine((word, context) => {
  if (word.status === "ready" && word.meanings.length === 0) {
    context.addIssue({ code: "custom", message: "ready 상태의 단어에는 뜻이 하나 이상 필요합니다.", path: ["meanings"] });
  }
});

export const externalBookCreateSchema = z.object({
  id: idSchema.refine((value) => value.startsWith("book-"), "id는 book- 접두사로 시작해야 합니다.").optional(),
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().max(100).nullable().default(null),
  folderId: idSchema.nullable().default(null),
  words: z.array(externalWordSchema).max(5_000).default([]),
}).strict();

export class ExternalApiFailure extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, unknown>) {
    super(message);
  }
}

function uuidFromSeed(seed: string) {
  const bytes = createHash("sha256").update(seed).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function mutationId(idempotencyKey: string | undefined, index: number) {
  return idempotencyKey ? uuidFromSeed(`jlpt-api-operation:${idempotencyKey}:${index}`) : randomUUID();
}

function failureStatus(code: string) {
  if (["ID_EXISTS", "OPERATION_ID_REUSED", "REVISION_CONFLICT"].includes(code)) return 409;
  if (code === "NOT_FOUND") return 404;
  return 400;
}

function accepted(result: MutationResult) {
  if (result.status === "applied" || result.status === "duplicate") return result;
  const code = result.error?.code || "REJECTED";
  throw new ExternalApiFailure(failureStatus(code), code, result.error?.message || "요청을 적용하지 못했습니다.", result.error?.details);
}

export function validateIdempotencyKey(value: string | null) {
  if (value === null) return undefined;
  if (!/^[\x21-\x7E]{1,128}$/.test(value)) throw new ExternalApiFailure(400, "VALIDATION", "Idempotency-Key는 1~128자의 ASCII 문자열이어야 합니다.");
  return value;
}

export function createExternalBook(db: AppDatabase, raw: unknown, idempotencyKey?: string) {
  const parsed = externalBookCreateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ExternalApiFailure(400, "VALIDATION", "단어장 형식을 확인해 주세요.", {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }

  const input = parsed.data;
  const bookId = input.id || `book-${idempotencyKey ? uuidFromSeed(`jlpt-api-book:${idempotencyKey}`) : randomUUID()}`;
  const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return db.transaction(() => {
    let replayed = true;
    let operationIndex = 0;
    const bookResult = accepted(applyMutation(db, "external-api", {
      operationId: mutationId(idempotencyKey, operationIndex++),
      type: "book.create",
      payload: {
        id: bookId,
        title: input.title,
        category: input.category,
        folderId: input.folderId,
        origin: "import",
        originRef: { source: "external-api", requestHash },
      },
    }));
    replayed = replayed && bookResult.status === "duplicate";

    const entries = input.words.map((word, index) => {
      const entryId = word.entryId || `entry-${idempotencyKey ? uuidFromSeed(`jlpt-api-entry:${idempotencyKey}:${index}`) : randomUUID()}`;
      const result = accepted(applyMutation(db, "external-api", {
        operationId: mutationId(idempotencyKey, operationIndex++),
        type: "entry.create",
        payload: {
          entryId,
          bookId,
          ...(word.wordId ? { wordId: word.wordId } : {}),
          position: index,
          fields: {
            term: word.term,
            reading: word.reading ?? null,
            meanings: word.meanings,
            primaryMeaning: word.primaryMeaning ?? word.meanings[0] ?? null,
            nuance: word.nuance ?? null,
            partOfSpeech: word.partOfSpeech,
            jlptLevels: word.jlptLevels,
            years: word.years,
            categories: word.categories,
            relatedTerms: word.relatedTerms,
            examples: word.examples,
            sources: word.sources,
            status: word.status,
            tags: word.tags,
          },
        },
      }));
      replayed = replayed && result.status === "duplicate";
      return result.entity;
    });

    const book = getBook(db, bookId);
    if (!book) throw new ExternalApiFailure(500, "INTERNAL", "생성된 단어장을 불러오지 못했습니다.");
    return { book, entries, replayed };
  })();
}
