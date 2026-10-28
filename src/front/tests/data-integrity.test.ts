import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { CollectionIndex, SearchIndex, SiteStats, WordBook } from "@/lib/types";

const sourceRoot = path.resolve(process.cwd(), "..", "..", "jlpt-vocabulary-dataset", "data");
const generatedRoot = path.resolve(process.cwd(), "public", "data");
const read = async <T>(root: string, relative: string) => JSON.parse(await readFile(path.join(root, relative), "utf8")) as T;

describe("generated data contract", () => {
  it("keeps source collection IDs and snapshot counts", async () => {
    const source = await read<CollectionIndex>(sourceRoot, "collections.json");
    const generated = await read<CollectionIndex>(generatedRoot, "collections.json");
    const stats = await read<SiteStats>(generatedRoot, "stats.json");
    const index = await read<SearchIndex>(generatedRoot, "search-index.json");
    expect(generated.collections.map((item) => item.id)).toEqual(source.collections.map((item) => item.id));
    expect(generated.total).toBe(27);
    expect(index.occurrences).toHaveLength(stats.wordEntries);
    expect(stats).toMatchObject({ wordEntries: 6393, uniqueAcrossWordbooks: 5373, readyEntries: 4481, needsReviewEntries: 1912 });
    expect(new Set(index.occurrences.map((item) => item.wordId)).size).toBe(stats.uniqueAcrossWordbooks);
  });

  it("maps every occurrence to its original position without data loss", async () => {
    const collections = await read<CollectionIndex>(sourceRoot, "collections.json");
    const search = await read<SearchIndex>(generatedRoot, "search-index.json");
    const lookup = new Map(search.occurrences.map((item) => [`${item.collectionId}:${item.position}`, item]));
    for (const meta of collections.collections) {
      const sourceBook = await read<WordBook>(sourceRoot, meta.dataFile);
      const generatedBook = await read<WordBook>(generatedRoot, `wordbooks/${meta.id}.json`);
      expect(generatedBook.words.map((word) => word.id)).toEqual(sourceBook.words.map((word) => word.id));
      sourceBook.words.forEach((word, position) => {
        expect(lookup.get(`${meta.id}:${position}`)).toMatchObject({ wordId: word.id, term: word.term, meanings: word.meanings, position });
      });
    }
  });

  it("preserves repeated identities and nullable needs-review fields", async () => {
    const search = await read<SearchIndex>(generatedRoot, "search-index.json");
    const byId = new Map<string, typeof search.occurrences>();
    for (const item of search.occurrences) byId.set(item.wordId, [...(byId.get(item.wordId) ?? []), item]);
    expect([...byId.values()].some((items) => items.length > 1)).toBe(true);
    expect(search.occurrences.some((item) => item.status === "needs-review" && (item.reading === null || item.meanings.length === 0))).toBe(true);
  });
});
