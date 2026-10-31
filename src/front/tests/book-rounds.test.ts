// @vitest-environment node

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import { getBook, listBooks } from "@back/lib/catalog/queries";
import { applyMutation } from "@back/lib/sync/mutations";

const fields = { term: "단어", reading: null, meanings: ["뜻"], primaryMeaning: "뜻", nuance: null, partOfSpeech: [], jlptLevels: [], years: [], categories: [], relatedTerms: [], examples: [], sources: [], status: "ready", tags: [] };

describe("book round counts", () => {
  it("combines completed chunks and ignores restarts, weak rounds, and other books", () => {
    const db = openDatabase(":memory:");
    try {
      createBook(db, "book-round-a", "회독 A", ["word-aaaaaaaaaaaa", "word-bbbbbbbbbbbb", "word-cccccccccccc"]);
      createBook(db, "book-round-b", "회독 B", ["word-aaaaaaaaaaaa"]);

      completeSession(db, "book-round-a", ["word-aaaaaaaaaaaa", "word-bbbbbbbbbbbb"]);
      completeSession(db, "book-round-a", ["word-cccccccccccc"]);
      completeSession(db, "book-round-b", ["word-aaaaaaaaaaaa"]);
      expect(getBook(db, "book-round-a")).toMatchObject({ roundCount: 1 });
      expect(getBook(db, "book-round-b")).toMatchObject({ roundCount: 1 });

      completeSession(db, "book-round-a", ["word-aaaaaaaaaaaa", "word-bbbbbbbbbbbb", "word-cccccccccccc"]);
      incompleteSession(db, "book-round-a", ["word-aaaaaaaaaaaa", "word-bbbbbbbbbbbb", "word-cccccccccccc"]);
      completeSession(db, "book-round-a", ["word-aaaaaaaaaaaa", "word-bbbbbbbbbbbb", "word-cccccccccccc"], "weak");

      expect(getBook(db, "book-round-a")).toMatchObject({ entryCount: 3, roundCount: 2 });
      expect(listBooks(db, { q: "회독 A" }).books[0]).toMatchObject({ id: "book-round-a", roundCount: 2 });
    } finally { db.close(); }
  });
});

function createBook(db: AppDatabase, bookId: string, title: string, wordIds: string[]) {
  mutate(db, "book.create", { id: bookId, title, folderId: null, category: null, orderIndex: 0 });
  wordIds.forEach((wordId, index) => mutate(db, "entry.create", {
    entryId: `entry-${bookId}-${index}`,
    bookId,
    wordId,
    position: index,
    fields: { ...fields, term: `단어 ${index + 1}` },
  }));
}

function completeSession(db: AppDatabase, bookId: string, wordIds: string[], mode: "all" | "weak" = "all") {
  const sessionId = `study-${randomUUID()}`;
  mutate(db, "session.create", { id: sessionId, bookIds: [bookId], mode, includeReview: true, wordIds, queue: wordIds, loopMode: false, results: [], position: 0, revealed: false, ratings: {}, status: "active" });
  mutate(db, "session.update", {
    queue: [],
    results: wordIds.map((wordId) => ({ wordId, rating: "good", occurredAt: "2026-10-31T00:00:00.000Z" })),
    position: wordIds.length,
    status: "completed",
  }, sessionId, 1);
}

function incompleteSession(db: AppDatabase, bookId: string, wordIds: string[]) {
  const sessionId = `study-${randomUUID()}`;
  mutate(db, "session.create", { id: sessionId, bookIds: [bookId], mode: "all", includeReview: true, wordIds, queue: wordIds, loopMode: false, results: [], position: 0, revealed: false, ratings: {}, status: "active" });
  mutate(db, "session.update", {
    queue: wordIds.slice(1),
    results: [{ wordId: wordIds[0], rating: "good", occurredAt: "2026-10-31T00:00:00.000Z" }],
    position: 1,
    status: "completed",
  }, sessionId, 1);
}

function mutate(db: AppDatabase, type: string, payload: Record<string, unknown>, targetId?: string, expectedRevision?: number) {
  const result = applyMutation(db, "round-test", { operationId: randomUUID(), type, payload, ...(targetId ? { targetId } : {}), ...(expectedRevision ? { expectedRevision } : {}) });
  expect(result.status).toBe("applied");
  return result;
}
