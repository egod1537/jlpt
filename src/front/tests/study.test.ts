import { describe, expect, it } from "vitest";
import { buildStudyCards, canRateCard, seededShuffle, shuffleNewRound } from "@/lib/study";
import { emptyProgress } from "@/lib/progress";
import type { Word, WordBook } from "@/lib/types";

const word = (id: string, status: "ready" | "needs-review", meaning: string): Word => ({ id, term: id, reading: status === "ready" ? "よみ" : null, meanings: meaning ? [meaning] : [], primaryMeaning: meaning || null, nuance: null, partOfSpeech: [], jlptLevels: [], years: [], categories: [], collectionIds: [], relatedTerms: [], examples: [], sources: [{ collectionId: "", sourceType: "attachment", sourceFile: "", line: null, year: null, section: null }], status });
const book = (id: string, words: Word[]): WordBook => ({ schemaVersion: "1", generatedAt: "", id, title: id, category: "", createdAt: "", sourceSession: "", sourceFiles: [], sourceRecordCount: words.length, total: words.length, words });

describe("study selection", () => {
  const shared = "word-000000000001";
  const second = "word-000000000002";
  const books = [book("session-001", [word(shared, "needs-review", "불확실"), word(second, "ready", "둘")]), book("session-002", [word(shared, "ready", "확인됨")])];

  it("preserves first-book order, deduplicates globally and prefers ready data", () => {
    const cards = buildStudyCards(books, emptyProgress(), { includeReview: false, mode: "all" });
    expect(cards.map((item) => item.wordId)).toEqual([shared, second]);
    expect(cards[0].occurrences).toHaveLength(2);
    expect(cards[0].representative.word.primaryMeaning).toBe("확인됨");
  });

  it("excludes review-only cards unless explicitly included", () => {
    const reviewBook = book("session-003", [word("word-000000000003", "needs-review", "")]);
    expect(buildStudyCards([reviewBook], emptyProgress(), { includeReview: false, mode: "all" })).toHaveLength(0);
    expect(buildStudyCards([reviewBook], emptyProgress(), { includeReview: true, mode: "all" })).toHaveLength(1);
  });

  it("filters unseen and due by shared identity", () => {
    const progress = emptyProgress();
    progress.records[shared] = { wordId: shared, repetitions: 1, intervalDays: 1, easeFactor: 2.5, dueAt: "2026-10-27T00:00:00.000Z", lastReviewedAt: "2026-10-26T00:00:00.000Z", lastRating: "good", lapses: 0 };
    expect(buildStudyCards(books, progress, { includeReview: false, mode: "unseen", now: new Date("2026-10-28") }).map((item) => item.wordId)).toEqual([second]);
    expect(buildStudyCards(books, progress, { includeReview: false, mode: "due", now: new Date("2026-10-28") }).map((item) => item.wordId)).toEqual([shared]);
  });

  it("has deterministic shuffle and rating guards", () => {
    expect(seededShuffle([1, 2, 3, 4], 42)).toEqual(seededShuffle([1, 2, 3, 4], 42));
    expect(shuffleNewRound([1, 2, 3, 4], () => 0.999)).toEqual([2, 1, 3, 4]);
    expect(shuffleNewRound([1], () => 0.999)).toEqual([1]);
    expect(canRateCard(false, false)).toBe(true);
    expect(canRateCard(true, false)).toBe(true);
    expect(canRateCard(true, true)).toBe(false);
  });
});
