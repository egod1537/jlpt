export const recentBooksStorageKey = "jlpt-library-recent-books-v1";

const maximumRecentBooks = 100;

type RecentBookStorage = Pick<Storage, "getItem" | "setItem">;

export function readRecentBookIds(storage: Pick<Storage, "getItem"> | null | undefined) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(recentBooksStorageKey) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((value): value is string => typeof value === "string" && value.length > 0 && value.length <= 128))].slice(0, maximumRecentBooks);
  } catch {
    return [];
  }
}

export function rememberRecentBook(storage: RecentBookStorage, bookId: string) {
  const next = [bookId, ...readRecentBookIds(storage).filter((id) => id !== bookId)].slice(0, maximumRecentBooks);
  try { storage.setItem(recentBooksStorageKey, JSON.stringify(next)); } catch { /* in-memory ordering still works */ }
  return next;
}

export function prioritizeRecentBooks<T extends { id: string }>(items: T[], recentBookIds: string[], fallback: (a: T, b: T) => number) {
  const rank = new Map(recentBookIds.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const aRank = rank.get(a.id);
    const bRank = rank.get(b.id);
    if (aRank !== undefined || bRank !== undefined) return (aRank ?? Number.MAX_SAFE_INTEGER) - (bRank ?? Number.MAX_SAFE_INTEGER);
    return fallback(a, b);
  });
}
