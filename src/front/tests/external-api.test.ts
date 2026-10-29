import { afterEach, describe, expect, it } from "vitest";
import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import { createExternalBook, ExternalApiFailure } from "@back/lib/external-api/books";

describe("external book API service", () => {
  let db: AppDatabase | undefined;
  afterEach(() => db?.close());

  it("creates all entries atomically and safely replays an idempotency key", () => {
    db = openDatabase(":memory:");
    const input = {
      id: "book-external-test",
      title: "외부 테스트",
      words: [
        { term: "気配", reading: "けはい", meanings: ["기척"], examples: [{ ja: "人の【気配】を感じる。", ko: "사람의 기척을 느끼다." }] },
        { term: "兆し", reading: "きざし", meanings: ["조짐"] },
      ],
    };

    const created = createExternalBook(db, input, "test-idempotency-key");
    expect(created.replayed).toBe(false);
    expect(created.book).toMatchObject({ id: input.id, entryCount: 2 });
    expect(created.entries).toHaveLength(2);

    const replayed = createExternalBook(db, input, "test-idempotency-key");
    expect(replayed.replayed).toBe(true);
    expect(db.prepare("SELECT COUNT(*) count FROM books WHERE id=?").get(input.id)).toEqual({ count: 1 });
    expect(db.prepare("SELECT COUNT(*) count FROM book_entries WHERE book_id=?").get(input.id)).toEqual({ count: 2 });

    expect(() => createExternalBook(db!, { ...input, title: "다른 요청" }, "test-idempotency-key")).toThrowError(ExternalApiFailure);
    expect(db.prepare("SELECT title FROM books WHERE id=?").get(input.id)).toEqual({ title: input.title });
  });

  it("rolls back the book when a later entry conflicts", () => {
    db = openDatabase(":memory:");
    const duplicateEntryId = "entry-external-duplicate";
    expect(() => createExternalBook(db!, {
      id: "book-external-rollback",
      title: "롤백 테스트",
      words: [
        { entryId: duplicateEntryId, term: "一", meanings: ["하나"] },
        { entryId: duplicateEntryId, term: "二", meanings: ["둘"] },
      ],
    })).toThrowError(ExternalApiFailure);
    expect(db.prepare("SELECT COUNT(*) count FROM books WHERE id='book-external-rollback'").get()).toEqual({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) count FROM book_entries WHERE entry_id=?").get(duplicateEntryId)).toEqual({ count: 0 });
  });
});
