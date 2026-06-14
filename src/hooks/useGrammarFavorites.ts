import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "jlpt-grammar-favorites";

function loadFavoriteIds(validIds: ReadonlySet<string>): string[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (rawValue === null) {
    return [];
  }

  try {
    const storedIds = JSON.parse(rawValue);

    if (!Array.isArray(storedIds)) {
      throw new Error("Invalid favorites value");
    }

    return storedIds.filter(
      (id): id is string => typeof id === "string" && validIds.has(id),
    );
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function useGrammarFavorites(validGrammarIds: readonly string[]) {
  const validIds = useMemo(() => new Set(validGrammarIds), [validGrammarIds]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds(validIds));
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds]);

  const toggleFavorite = (grammarId: string) => {
    if (!validIds.has(grammarId)) {
      return;
    }

    setFavoriteIds((currentIds) =>
      currentIds.includes(grammarId)
        ? currentIds.filter((id) => id !== grammarId)
        : [...currentIds, grammarId],
    );
  };

  return {
    favoriteIds,
    favoriteIdSet,
    toggleFavorite,
  };
}
