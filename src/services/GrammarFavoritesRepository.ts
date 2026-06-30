const STORAGE_KEY = "jlpt-grammar-favorites";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export class GrammarFavoritesRepository {
  private readonly validIds: ReadonlySet<string>;

  constructor(validGrammarIds: readonly string[]) {
    this.validIds = new Set(validGrammarIds);
  }

  load(): string[] {
    if (!canUseStorage()) {
      return [];
    }

    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (rawValue === null) {
      return [];
    }

    try {
      const storedIds: unknown = JSON.parse(rawValue);

      if (!Array.isArray(storedIds)) {
        throw new Error("Invalid favorites value");
      }

      return storedIds.filter(
        (id): id is string => typeof id === "string" && this.validIds.has(id),
      );
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  toggle(currentIds: readonly string[], grammarId: string): string[] {
    if (!this.validIds.has(grammarId)) {
      return [...currentIds];
    }

    const nextIds = currentIds.includes(grammarId)
      ? currentIds.filter((id) => id !== grammarId)
      : [...currentIds, grammarId];

    this.save(nextIds);
    return nextIds;
  }

  private save(favoriteIds: readonly string[]): void {
    if (canUseStorage()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    }
  }
}
