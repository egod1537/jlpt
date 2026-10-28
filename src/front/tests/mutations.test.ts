// @vitest-environment node

import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { openDatabase } from "@back/lib/db/database";
import { applyMutation } from "@back/lib/sync/mutations";
import { purgeTrash } from "@back/lib/catalog/trash";

function operation(type: string, payload: Record<string, unknown>, targetId?: string, expectedRevision?: number) {
  return { operationId: randomUUID(), type, payload, ...(targetId ? { targetId } : {}), ...(expectedRevision ? { expectedRevision } : {}) };
}

describe("catalog mutations", () => {
  it("deduplicates operations and rejects revision conflicts", () => {
    const db = openDatabase(":memory:");
    try {
      const create = operation("folder.create", { id: "folder-one", name: "첫 폴더", parentId: null, orderIndex: 0 });
      expect(applyMutation(db, "device-a", create)).toMatchObject({ status: "applied", entity: { id: "folder-one", revision: 1 } });
      expect(applyMutation(db, "device-a", create)).toMatchObject({ status: "duplicate", entity: { id: "folder-one" } });
      expect(db.prepare("SELECT COUNT(*) count FROM folders").get()).toEqual({ count: 1 });
      const rename = operation("folder.rename", { name: "변경" }, "folder-one", 1);
      expect(applyMutation(db, "device-a", rename)).toMatchObject({ status: "applied", serverRevision: 2 });
      expect(applyMutation(db, "device-b", operation("folder.rename", { name: "충돌" }, "folder-one", 1))).toMatchObject({ status: "conflict", serverRevision: 2, entity: { name: "변경" } });
    } finally {
      db.close();
    }
  });

  it("enforces normalized sibling names, depth, and cycles", () => {
    const db = openDatabase(":memory:");
    try {
      expect(applyMutation(db, "device", operation("folder.create", { id: "folder-a", name: "ＡＢＣ", parentId: null, orderIndex: 0 }))).toMatchObject({ status: "applied" });
      expect(applyMutation(db, "device", operation("folder.create", { id: "folder-duplicate", name: "abc", parentId: null, orderIndex: 1 }))).toMatchObject({ status: "rejected", error: { code: "DUPLICATE_NAME" } });
      let parent = "folder-a";
      for (let depth = 2; depth <= 5; depth += 1) {
        const id = `folder-${depth}`;
        expect(applyMutation(db, "device", operation("folder.create", { id, name: `깊이 ${depth}`, parentId: parent, orderIndex: 0 }))).toMatchObject({ status: "applied" });
        parent = id;
      }
      expect(applyMutation(db, "device", operation("folder.create", { id: "folder-6", name: "너무 깊음", parentId: parent, orderIndex: 0 }))).toMatchObject({ status: "rejected", error: { code: "FOLDER_DEPTH" } });
      expect(applyMutation(db, "device", operation("folder.move", { parentId: "folder-2", orderIndex: 0 }, "folder-a", 1))).toMatchObject({ status: "rejected", error: { code: "FOLDER_CYCLE" } });
    } finally {
      db.close();
    }
  });

  it("applies both folder trash policies and restores a deleted subtree explicitly", () => {
    const db = openDatabase(":memory:");
    try {
      expect(applyMutation(db, "device", operation("folder.create", { id: "folder-root", name: "상위", parentId: null, orderIndex: 0 }))).toMatchObject({ status: "applied" });
      expect(applyMutation(db, "device", operation("folder.create", { id: "folder-child", name: "하위", parentId: "folder-root", orderIndex: 0 }))).toMatchObject({ status: "applied" });
      const looseBook = `book-${randomUUID()}`;
      expect(applyMutation(db, "device", operation("book.create", { id: looseBook, title: "남길 세트", folderId: "folder-root", category: null, orderIndex: 0 }))).toMatchObject({ status: "applied" });
      expect(applyMutation(db, "device", operation("folder.delete", { policy: "unfile-books" }, "folder-root", 1))).toMatchObject({ status: "applied" });
      expect(db.prepare("SELECT folder_id FROM books WHERE id=?").get(looseBook)).toEqual({ folder_id: null });
      expect(db.prepare("SELECT parent_id FROM folders WHERE id='folder-child'").get()).toEqual({ parent_id: null });
      expect(applyMutation(db, "device", operation("folder.restore", { parentId: null, orderIndex: 0 }, "folder-root", 2))).toMatchObject({ status: "applied", entity: { revision: 3 } });

      expect(applyMutation(db, "device", operation("folder.move", { parentId: "folder-root", orderIndex: 0 }, "folder-child", 2))).toMatchObject({ status: "applied", entity: { revision: 3 } });
      const nestedBook = `book-${randomUUID()}`;
      expect(applyMutation(db, "device", operation("book.create", { id: nestedBook, title: "함께 지울 세트", folderId: "folder-child", category: null, orderIndex: 0 }))).toMatchObject({ status: "applied" });
      expect(applyMutation(db, "device", operation("folder.delete", { policy: "trash-contents" }, "folder-root", 3))).toMatchObject({ status: "applied" });
      expect(db.prepare("SELECT deleted_at IS NOT NULL deleted FROM folders WHERE id='folder-child'").get()).toEqual({ deleted: 1 });
      expect(db.prepare("SELECT deleted_at IS NOT NULL deleted FROM books WHERE id=?").get(nestedBook)).toEqual({ deleted: 1 });
      expect(applyMutation(db, "device", operation("folder.restore", { parentId: null, orderIndex: 0 }, "folder-root", 4))).toMatchObject({ status: "applied" });
      expect(applyMutation(db, "device", operation("folder.restore", { parentId: "folder-root", orderIndex: 0 }, "folder-child", 4))).toMatchObject({ status: "applied" });
      expect(applyMutation(db, "device", operation("book.restore", { folderId: "folder-child" }, nestedBook, 2))).toMatchObject({ status: "applied", entity: { folderId: "folder-child" } });
    } finally {
      db.close();
    }
  });

  it("creates books and independent entries while recording a change log", () => {
    const db = openDatabase(":memory:");
    try {
      const bookId = `book-${randomUUID()}`;
      expect(applyMutation(db, "device", operation("book.create", { id: bookId, title: "내 단어장", folderId: null, category: "직접", orderIndex: 0 }))).toMatchObject({ status: "applied", entity: { id: bookId } });
      const fields = {
        term: "学ぶ", reading: "まなぶ", meanings: ["배우다"], primaryMeaning: "배우다", nuance: null,
        partOfSpeech: ["동사"], jlptLevels: ["N3"], years: [], categories: [], relatedTerms: [],
        examples: [{ ja: "日本語を学ぶ。", ko: "일본어를 배우다." }], sources: [], status: "ready", tags: ["기본"],
      };
      const firstId = `entry-${randomUUID()}`;
      const secondId = `entry-${randomUUID()}`;
      const first = applyMutation(db, "device", operation("entry.create", { entryId: firstId, bookId, position: 0, fields }));
      expect(first).toMatchObject({ status: "applied", entity: { position: 0, term: "学ぶ", meanings: ["배우다"] } });
      expect(applyMutation(db, "device", operation("entry.create", { entryId: secondId, bookId, position: 0, fields: { ...fields, term: "読む", reading: "よむ", meanings: ["읽다"] } }))).toMatchObject({ status: "applied", entity: { position: 0 } });
      expect(db.prepare("SELECT entry_id FROM book_entries WHERE book_id=? ORDER BY position").all(bookId)).toEqual([{ entry_id: secondId }, { entry_id: firstId }]);
      expect((db.prepare("SELECT COUNT(*) count FROM sync_changes").get() as { count: number }).count).toBeGreaterThanOrEqual(5);
    } finally {
      db.close();
    }
  });

  it("permanently purges trashed catalog data while preserving learning history", () => {
    const db = openDatabase(":memory:");
    try {
      const bookId = `book-${randomUUID()}`;
      const entryId = `entry-${randomUUID()}`;
      const createBook = applyMutation(db, "device", operation("book.create", { id: bookId, title: "삭제할 세트", folderId: null, category: null, orderIndex: 0 }));
      expect(createBook).toMatchObject({ status: "applied" });
      const fields = { term: "残す", reading: "のこす", meanings: ["남기다"], primaryMeaning: "남기다", nuance: null, partOfSpeech: [], jlptLevels: [], years: [], categories: [], relatedTerms: [], examples: [], sources: [], status: "ready", tags: [] };
      const createdEntry = applyMutation(db, "device", operation("entry.create", { entryId, bookId, position: 0, fields }));
      expect(createdEntry).toMatchObject({ status: "applied" });
      const wordId = String((createdEntry.entity as { wordId: string }).wordId);
      expect(applyMutation(db, "device", operation("review.rate", { wordId, rating: "good", sessionId: null, context: "new" }))).toMatchObject({ status: "applied" });
      const currentRevision = Number((db.prepare("SELECT revision FROM books WHERE id=?").get(bookId) as { revision: number }).revision);
      expect(applyMutation(db, "device", operation("book.delete", {}, bookId, currentRevision))).toMatchObject({ status: "applied" });

      expect(purgeTrash(db)).toMatchObject({ books: 1, entries: 1, learningHistoryPreserved: true });
      expect(db.prepare("SELECT COUNT(*) count FROM books WHERE id=?").get(bookId)).toEqual({ count: 0 });
      expect(db.prepare("SELECT COUNT(*) count FROM book_entries WHERE entry_id=?").get(entryId)).toEqual({ count: 0 });
      expect(db.prepare("SELECT COUNT(*) count FROM review_events WHERE word_id=?").get(wordId)).toEqual({ count: 1 });
      expect(db.prepare("SELECT COUNT(*) count FROM review_states WHERE word_id=?").get(wordId)).toEqual({ count: 1 });
      expect(db.prepare("SELECT COUNT(*) count FROM word_keys WHERE word_id=?").get(wordId)).toEqual({ count: 1 });
    } finally {
      db.close();
    }
  });
});
