import { describe, expect, it } from "vitest";
import { prioritizeRecentBooks, readRecentBookIds, recentBooksStorageKey, rememberRecentBook } from "@/lib/library-recency";

function memoryStorage(initial = "") {
  const values = new Map<string, string>();
  if (initial) values.set(recentBooksStorageKey, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("library recent book ordering", () => {
  it("moves the last opened book to the front and persists MRU order", () => {
    const storage = memoryStorage(JSON.stringify(["book-b", "book-a"]));

    expect(rememberRecentBook(storage, "book-a")).toEqual(["book-a", "book-b"]);
    expect(readRecentBookIds(storage)).toEqual(["book-a", "book-b"]);
  });

  it("prioritizes opened books while preserving the configured fallback order", () => {
    const books = [
      { id: "book-a", order: 1 },
      { id: "book-b", order: 2 },
      { id: "book-c", order: 0 },
    ];

    expect(prioritizeRecentBooks(books, ["book-b"], (a, b) => a.order - b.order).map((book) => book.id)).toEqual([
      "book-b",
      "book-c",
      "book-a",
    ]);
  });

  it("ignores malformed stored history", () => {
    expect(readRecentBookIds(memoryStorage("not-json"))).toEqual([]);
    expect(readRecentBookIds(memoryStorage(JSON.stringify({ id: "book-a" })))).toEqual([]);
  });
});
