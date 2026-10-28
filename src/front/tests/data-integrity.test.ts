// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openDatabase } from "@back/lib/db/database";
import { seedDatabase } from "@back/lib/seed/seed";

const sourceRoot = path.resolve(process.cwd(), "..", "..", "jlpt-vocabulary-dataset", "data");

describe("private database seed", () => {
  it("imports the original data exactly once without public generated assets", () => {
    const db = openDatabase(":memory:");
    try {
      const first = seedDatabase(db, sourceRoot);
      const second = seedDatabase(db, sourceRoot);
      expect(first).toMatchObject({ status: "imported", collections: 27, occurrences: 6393, uniqueWords: 5373, ready: 4481, needsReview: 1912 });
      expect(second).toMatchObject({ status: "unchanged", sourceSha256: first.sourceSha256 });
      expect(db.prepare("SELECT COUNT(*) count FROM books").get()).toEqual({ count: 27 });
      expect(db.prepare("SELECT COUNT(*) count FROM book_entries").get()).toEqual({ count: 6393 });
      expect(db.prepare("SELECT COUNT(*) count FROM word_keys").get()).toEqual({ count: 5373 });
    } finally {
      db.close();
    }
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
