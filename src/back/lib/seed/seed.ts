import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { AppDatabase } from "@back/lib/db/database";
import { seedBookSchema, seedCollectionsSchema, seedStatsSchema } from "@back/lib/seed/schema";
import { seedHtmlReference, type HtmlSeedResult } from "@back/lib/seed/html-reference";

function readSource(filePath: string) {
  const raw = readFileSync(filePath);
  return { raw, json: JSON.parse(raw.toString("utf8")) as unknown };
}

function deterministicUuid(value: string) {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

export interface SeedResult {
  status: "imported" | "unchanged";
  collections: number;
  occurrences: number;
  uniqueWords: number;
  ready: number;
  needsReview: number;
  sourceSha256: string;
  html: HtmlSeedResult;
}

export function seedDatabase(db: AppDatabase, dataRoot: string): SeedResult {
  const collectionsSource = readSource(path.join(dataRoot, "collections.json"));
  const statsSource = readSource(path.join(dataRoot, "stats.json"));
  const reviewSource = readSource(path.join(dataRoot, "review.json"));
  const collections = seedCollectionsSchema.parse(collectionsSource.json);
  const stats = seedStatsSchema.parse(statsSource.json);
  if (collections.total !== collections.collections.length) throw new Error("collections.total mismatch");

  const hasher = createHash("sha256");
  hasher.update(collectionsSource.raw).update(statsSource.raw).update(reviewSource.raw);
  const books = collections.collections.map((meta) => {
    const relative = path.normalize(meta.dataFile);
    if (path.isAbsolute(relative) || relative.startsWith("..")) throw new Error(`unsafe seed path: ${meta.dataFile}`);
    const source = readSource(path.join(dataRoot, relative));
    hasher.update(source.raw);
    const book = seedBookSchema.parse(source.json);
    if (book.id !== meta.id || book.title !== meta.title || book.total !== book.words.length || meta.wordCount !== book.total) throw new Error(`${meta.id} metadata mismatch`);
    return { meta, book };
  });
  const sourceSha256 = hasher.digest("hex");
  const sourceKey = `dataset:${collections.schemaVersion}:${collections.generatedAt}`;
  const prior = db.prepare("SELECT source_sha256, source_stats_json FROM seed_imports WHERE source_key = ?").get(sourceKey) as { source_sha256: string; source_stats_json: string } | undefined;
  if (prior) {
    if (prior.source_sha256 !== sourceSha256) throw new Error("seed source changed after import; manual reconciliation required");
    return { status: "unchanged", ...JSON.parse(prior.source_stats_json) as Omit<SeedResult, "status" | "sourceSha256" | "html">, sourceSha256, html: seedHtmlReference(db, dataRoot) };
  }

  const allWords = books.flatMap(({ book }) => book.words);
  const computed = {
    collections: books.length,
    occurrences: allWords.length,
    uniqueWords: new Set(allWords.map((word) => word.id)).size,
    ready: allWords.filter((word) => word.status === "ready").length,
    needsReview: allWords.filter((word) => word.status === "needs-review").length,
  };
  if (computed.collections !== stats.wordbookFiles || computed.occurrences !== stats.wordEntries || computed.uniqueWords !== stats.uniqueAcrossWordbooks || computed.ready !== stats.readyEntries || computed.needsReview !== stats.needsReviewEntries) throw new Error("seed counts do not match stats.json");

  const insertBook = db.prepare(`INSERT INTO books(id,title,category,folder_id,favorite,order_index,origin,origin_ref,revision,created_at,updated_at,deleted_at)
    VALUES (@id,@title,@category,NULL,0,@orderIndex,'seed',@originRef,1,@createdAt,@updatedAt,NULL)`);
  const insertWord = db.prepare("INSERT OR IGNORE INTO word_keys(word_id, created_at, retired_at) VALUES (?, ?, NULL)");
  const insertEntry = db.prepare(`INSERT INTO book_entries(entry_id,book_id,word_id,position,term,reading,meanings_json,primary_meaning,nuance,part_of_speech_json,jlpt_levels_json,years_json,categories_json,related_terms_json,examples_json,sources_json,status,tags_json,revision,created_at,updated_at,deleted_at)
    VALUES (@entryId,@bookId,@wordId,@position,@term,@reading,@meanings,@primaryMeaning,@nuance,@partOfSpeech,@jlptLevels,@years,@categories,@relatedTerms,@examples,@sources,@status,'[]',1,@createdAt,@updatedAt,NULL)`);
  const importSeed = db.transaction(() => {
    books.forEach(({ meta, book }, orderIndex) => {
      insertBook.run({ id: book.id, title: book.title, category: book.category, orderIndex, originRef: JSON.stringify({ dataFile: meta.dataFile, generatedAt: book.generatedAt, sourceSession: book.sourceSession }), createdAt: book.createdAt, updatedAt: book.generatedAt });
      book.words.forEach((word, position) => {
        insertWord.run(word.id, book.generatedAt);
        insertEntry.run({ entryId: deterministicUuid(`${book.id}:${position}:${word.id}`), bookId: book.id, wordId: word.id, position, term: word.term, reading: word.reading, meanings: JSON.stringify(word.meanings), primaryMeaning: word.primaryMeaning, nuance: word.nuance, partOfSpeech: JSON.stringify(word.partOfSpeech), jlptLevels: JSON.stringify(word.jlptLevels), years: JSON.stringify(word.years), categories: JSON.stringify(word.categories), relatedTerms: JSON.stringify(word.relatedTerms), examples: JSON.stringify(word.examples), sources: JSON.stringify(word.sources), status: word.status, createdAt: book.generatedAt, updatedAt: book.generatedAt });
      });
    });
    db.prepare("INSERT INTO seed_imports(source_key,source_sha256,imported_at,source_stats_json) VALUES (?,?,?,?)").run(sourceKey, sourceSha256, new Date().toISOString(), JSON.stringify(computed));
  });
  importSeed();

  const databaseCounts = db.prepare("SELECT (SELECT COUNT(*) FROM books WHERE deleted_at IS NULL) books, (SELECT COUNT(*) FROM book_entries WHERE deleted_at IS NULL) entries, (SELECT COUNT(*) FROM word_keys) words").get() as { books: number; entries: number; words: number };
  if (databaseCounts.books !== computed.collections || databaseCounts.entries !== computed.occurrences || databaseCounts.words !== computed.uniqueWords) throw new Error("database counts do not match seed counts");
  return { status: "imported", ...computed, sourceSha256, html: seedHtmlReference(db, dataRoot) };
}
