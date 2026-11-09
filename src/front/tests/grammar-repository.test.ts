import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { AppDatabase } from "@back/lib/db/database";
import { openDatabase } from "@back/lib/db/database";
import {
  createGrammarBook, createGrammarNote, deleteGrammarBook, deleteGrammarNote, getGrammarBook, GrammarFailure,
  listGrammarBooks, seedGrammarCatalog, updateGrammarBook, updateGrammarNote,
} from "@back/lib/grammar/repository";

describe("grammar book and note repository", () => {
  let db: AppDatabase | undefined;
  afterEach(() => db?.close());

  it("creates, reads, updates, and soft deletes a book with notes", () => {
    db = openDatabase(":memory:");
    const created = createGrammarBook(db, {
      id: "grammar-api-test",
      title: "API 문법책",
      description: "테스트",
      type: "book",
      notes: [{ id: "note-one", pattern: "～に際して", meaning: "~에 즈음하여", connection: ["명사 + に際して"], examples: [{ japanese: "出発に際して挨拶した。", korean: "출발에 즈음하여 인사했다." }] }],
    });

    expect(created).toMatchObject({ id: "grammar-api-test", revision: 1, noteCount: 1 });
    expect(created.notes[0]).toMatchObject({ id: "note-one", position: 0, revision: 1 });
    expect(listGrammarBooks(db).books.some((book) => book.id === created.id)).toBe(true);

    const updated = updateGrammarBook(db, created.id, { revision: created.revision, title: "수정된 문법책" });
    expect(updated).toMatchObject({ title: "수정된 문법책", revision: 2 });
    expect(() => updateGrammarBook(db!, created.id, { revision: 1, title: "충돌" })).toThrowError(GrammarFailure);

    const note = updateGrammarNote(db, created.id, "note-one", { revision: 1, explanation: "격식 있는 상황에서 사용한다." });
    expect(note).toMatchObject({ explanation: "격식 있는 상황에서 사용한다.", revision: 2 });
    deleteGrammarNote(db, created.id, note.id, note.revision);
    expect(getGrammarBook(db, created.id).notes).toEqual([]);

    deleteGrammarBook(db, created.id, updated.revision);
    expect(() => getGrammarBook(db!, created.id)).toThrowError(GrammarFailure);
  });

  it("creates notes independently and allocates the next position", () => {
    db = openDatabase(":memory:");
    const book = createGrammarBook(db, { title: "노트 추가", type: "flashcard" });
    const first = createGrammarNote(db, book.id, { pattern: "～ものの", meaning: "~이기는 하지만" });
    const second = createGrammarNote(db, book.id, { pattern: "～とはいえ", meaning: "~라고는 해도" });
    expect([first.position, second.position]).toEqual([0, 1]);
  });

  it("seeds built-in content once without overwriting later edits or resurrecting deletes", () => {
    db = openDatabase(":memory:");
    const seed = [{ sourceKind: "builtin" as const, id: "builtin-book", title: "기본", type: "book" as const, notes: [{ id: "builtin-note", pattern: "～をもって" }] }];
    seedGrammarCatalog(db, "v1", seed);
    const book = getGrammarBook(db, "builtin-book");
    const edited = updateGrammarBook(db, book.id, { revision: book.revision, title: "사용자 수정" });
    seedGrammarCatalog(db, "v2", seed);
    expect(getGrammarBook(db, book.id).title).toBe("사용자 수정");
    deleteGrammarBook(db, book.id, edited.revision);
    seedGrammarCatalog(db, "v3", seed);
    expect(() => getGrammarBook(db!, book.id)).toThrowError(GrammarFailure);
  });
});
