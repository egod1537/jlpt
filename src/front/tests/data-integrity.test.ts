// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openDatabase } from "@back/lib/db/database";
import { seedDatabase } from "@back/lib/seed/seed";

const sourceRoot = path.resolve(process.cwd(), "..", "..", "dataset", "data");

describe("private database seed", () => {
  it("imports the original data exactly once without public generated assets", () => {
    const db = openDatabase(":memory:");
    try {
      const first = seedDatabase(db, sourceRoot);
      db.prepare("UPDATE books SET title='사용자 수정 제목',revision=revision+1 WHERE id='html-n1-yuui-79-84'").run();
      const htmlWord = db.prepare("SELECT word_id FROM book_entries WHERE book_id='html-n1-yuui-79-84' ORDER BY position LIMIT 1").get() as { word_id: string };
      db.prepare("INSERT INTO review_states(word_id,scheduler_version,serialized_state_json,due_at,last_reviewed_at,last_rating,lapses,repetitions,known_flag) VALUES (?,'test','{}',NULL,'2026-10-28T00:00:00.000Z','good',0,1,1)").run(htmlWord.word_id);
      const second = seedDatabase(db, sourceRoot);
      expect(first).toMatchObject({ status: "imported", collections: 27, occurrences: 6393, uniqueWords: 5373, ready: 4481, needsReview: 1912, html: { status: "imported", cards: 268, uniqueJapanese: 244 } });
      expect(second).toMatchObject({ status: "unchanged", sourceSha256: first.sourceSha256, html: { status: "unchanged" } });
      expect(db.prepare("SELECT COUNT(*) count FROM books").get()).toEqual({ count: 28 });
      expect(db.prepare("SELECT COUNT(*) count FROM book_entries").get()).toEqual({ count: 6661 });
      expect(db.prepare("SELECT COUNT(*) count FROM word_keys").get()).toEqual({ count: 5641 });
      expect(db.prepare("SELECT title FROM books WHERE id='html-n1-yuui-79-84'").get()).toEqual({ title: "사용자 수정 제목" });
      expect(db.prepare("SELECT COUNT(*) count FROM review_states WHERE word_id=?").get(htmlWord.word_id)).toEqual({ count: 1 });
      expect(readFileSync(path.resolve(sourceRoot, "..", "flashcard-template.html"), "utf8")).toContain("const words = [");
      expect(() => readFileSync(path.resolve(process.cwd(), "public", "flashcard-template.html"))).toThrow();
    } finally {
      db.close();
    }
  });

  it("imports all 268 HTML cards in source order with separate nuance identities", () => {
    const db = openDatabase(":memory:");
    try {
      seedDatabase(db, sourceRoot);
      const rows = db.prepare("SELECT word_id,position,term,reading,meanings_json,nuance,part_of_speech_json,tags_json,examples_json FROM book_entries WHERE book_id='html-n1-yuui-79-84' ORDER BY position").all() as Array<Record<string, unknown>>;
      expect(rows).toHaveLength(268);
      expect(rows.map((row) => Number(row.position))).toEqual(Array.from({ length: 268 }, (_, index) => index));
      expect(new Set(rows.map((row) => row.word_id)).size).toBe(268);
      expect(new Set(rows.map((row) => row.term)).size).toBe(244);
      expect(new Set(rows.map((row) => JSON.parse(String(row.part_of_speech_json))[0])).size).toBe(7);
      expect(rows.filter((row) => row.term === "生地").map((row) => row.nuance)).toEqual(["타고난 바탕", "천"]);
      expect(rows.filter((row) => row.term === "理屈").map((row) => row.nuance)).toEqual(["도리", "억지·핑계"]);
      expect(rows[0]).toMatchObject({ position: 0, term: "暗示", reading: "あんじ" });
      expect(JSON.parse(String(rows[0].tags_json))).toContain("source-star:1");
      expect(JSON.parse(String(rows[0].examples_json))[0].ja).toContain("【暗示】");
    } finally { db.close(); }
  });

  it("preserves source order, content fields, and shared word identities", () => {
    const db = openDatabase(":memory:");
    try {
      seedDatabase(db, sourceRoot);
      const collections = JSON.parse(readFileSync(path.join(sourceRoot, "collections.json"), "utf8")) as { collections: Array<{ id: string; dataFile: string }> };
      for (const meta of collections.collections) {
        const source = JSON.parse(readFileSync(path.join(sourceRoot, meta.dataFile), "utf8")) as { words: Array<Record<string, unknown> & { id: string }> };
        const rows = db.prepare("SELECT word_id,term,reading,meanings_json,examples_json,sources_json,status FROM book_entries WHERE book_id=? ORDER BY position").all(meta.id) as Array<Record<string, unknown>>;
        expect(rows.map((row) => row.word_id)).toEqual(source.words.map((word) => word.id));
        source.words.forEach((word, index) => {
          expect(rows[index]).toMatchObject({
            word_id: word.id,
            term: word.term,
            reading: word.reading,
            meanings_json: JSON.stringify(word.meanings),
            examples_json: JSON.stringify(word.examples),
            sources_json: JSON.stringify(word.sources),
            status: word.status,
          });
        });
      }
      const repeated = db.prepare("SELECT word_id,COUNT(*) count FROM book_entries GROUP BY word_id HAVING count > 1 LIMIT 1").get() as { word_id: string; count: number };
      expect(repeated.count).toBeGreaterThan(1);
      expect(db.prepare("SELECT COUNT(*) count FROM word_keys WHERE word_id=?").get(repeated.word_id)).toEqual({ count: 1 });
    } finally {
      db.close();
    }
  });
});
