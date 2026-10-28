import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { AppDatabase } from "@back/lib/db/database";

const sourceKey = "html:n1-yuui-79-84:v1";
const htmlCardSchema = z.object({
  entryId: z.string().regex(/^html-entry-[a-f0-9]{20}$/),
  wordId: z.string().regex(/^word-[a-f0-9]{12}$/),
  sourceIndex: z.number().int().min(1).max(268),
  term: z.string().min(1).max(200),
  reading: z.string().min(1).max(200),
  meanings: z.array(z.string().min(1).max(1_000)).min(1).max(10),
  primaryMeaning: z.string().min(1).max(1_000),
  nuance: z.string().max(1_000).nullable(),
  partOfSpeech: z.array(z.string().min(1).max(100)).length(1),
  sourcePriority: z.number().int().min(0).max(3),
  examples: z.array(z.object({ ja: z.string().min(1).max(4_000), ko: z.string().min(1).max(4_000) })).length(1),
  tags: z.array(z.string().min(1).max(200)).max(20),
  source: z.object({ sourceType: z.literal("html"), sourceFile: z.literal("flashcard-template.html"), sourceIndex: z.number().int(), sourcePriority: z.number().int().min(0).max(3) }),
});

const htmlBookSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  id: z.literal("html-n1-yuui-79-84"),
  title: z.string().min(1).max(160),
  category: z.string().min(1).max(100),
  sourceFile: z.literal("flashcard-template.html"),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  total: z.literal(268),
  uniqueJapanese: z.literal(244),
  partOfSpeechCount: z.literal(7),
  cards: z.array(htmlCardSchema).length(268),
}).superRefine((book, context) => {
  if (new Set(book.cards.map((card) => card.sourceIndex)).size !== 268) context.addIssue({ code: "custom", message: "HTML sourceIndex가 중복됩니다.", path: ["cards"] });
  if (new Set(book.cards.map((card) => card.entryId)).size !== 268) context.addIssue({ code: "custom", message: "HTML entryId가 중복됩니다.", path: ["cards"] });
  if (new Set(book.cards.map((card) => card.wordId)).size !== 268) context.addIssue({ code: "custom", message: "HTML wordId가 중복됩니다.", path: ["cards"] });
});

export interface HtmlSeedResult {
  status: "imported" | "unchanged";
  bookId: "html-n1-yuui-79-84";
  cards: 268;
  uniqueJapanese: 244;
  sourceSha256: string;
}

export function seedHtmlReference(db: AppDatabase, dataRoot: string): HtmlSeedResult {
  const document = htmlBookSchema.parse(JSON.parse(readFileSync(path.join(dataRoot, "imported-html", "n1-yuui-79-84.json"), "utf8")));
  const prior = db.prepare("SELECT source_sha256 FROM seed_imports WHERE source_key=?").get(sourceKey) as { source_sha256: string } | undefined;
  if (prior) {
    if (prior.source_sha256 !== document.sourceSha256) throw new Error("HTML seed source changed after import; create a new source version before reconciling");
    const count = Number((db.prepare("SELECT COUNT(*) count FROM book_entries WHERE book_id=?").get(document.id) as { count: number }).count);
    if (count !== document.total) throw new Error("HTML seed import record exists but its 268 cards are incomplete");
    return { status: "unchanged", bookId: document.id, cards: 268, uniqueJapanese: 244, sourceSha256: document.sourceSha256 };
  }
  if (db.prepare("SELECT 1 FROM books WHERE id=?").get(document.id)) throw new Error("HTML seed book already exists without a matching import record; manual reconciliation required");

  const timestamp = new Date().toISOString();
  const insertBook = db.prepare(`INSERT INTO books(id,title,category,folder_id,favorite,order_index,origin,origin_ref,revision,created_at,updated_at,deleted_at)
    VALUES (@id,@title,@category,NULL,0,@orderIndex,'seed',@originRef,1,@timestamp,@timestamp,NULL)`);
  const insertWord = db.prepare("INSERT INTO word_keys(word_id,created_at,retired_at) VALUES (?,?,NULL)");
  const insertEntry = db.prepare(`INSERT INTO book_entries(entry_id,book_id,word_id,position,term,reading,meanings_json,primary_meaning,nuance,part_of_speech_json,jlpt_levels_json,years_json,categories_json,related_terms_json,examples_json,sources_json,status,tags_json,revision,created_at,updated_at,deleted_at)
    VALUES (@entryId,@bookId,@wordId,@position,@term,@reading,@meanings,@primaryMeaning,@nuance,@partOfSpeech,'["N1"]','[]','["N1 유의표현 79–84"]','[]',@examples,@sources,'ready',@tags,1,@timestamp,@timestamp,NULL)`);
  db.transaction(() => {
    const orderIndex = Number((db.prepare("SELECT COALESCE(MAX(order_index),-1)+1 value FROM books WHERE deleted_at IS NULL").get() as { value: number }).value);
    insertBook.run({ id: document.id, title: document.title, category: document.category, orderIndex, originRef: JSON.stringify({ sourceKey, sourceFile: document.sourceFile, sourceSha256: document.sourceSha256 }), timestamp });
    for (const [position, card] of document.cards.entries()) {
      insertWord.run(card.wordId, timestamp);
      insertEntry.run({ entryId: card.entryId, bookId: document.id, wordId: card.wordId, position, term: card.term, reading: card.reading, meanings: JSON.stringify(card.meanings), primaryMeaning: card.primaryMeaning, nuance: card.nuance, partOfSpeech: JSON.stringify(card.partOfSpeech), examples: JSON.stringify(card.examples), sources: JSON.stringify([card.source]), tags: JSON.stringify(card.tags), timestamp });
    }
    db.prepare("INSERT INTO seed_imports(source_key,source_sha256,imported_at,source_stats_json) VALUES (?,?,?,?)")
      .run(sourceKey, document.sourceSha256, timestamp, JSON.stringify({ bookId: document.id, cards: document.total, uniqueJapanese: document.uniqueJapanese, partOfSpeechCount: document.partOfSpeechCount }));
  })();
  return { status: "imported", bookId: document.id, cards: 268, uniqueJapanese: 244, sourceSha256: document.sourceSha256 };
}
