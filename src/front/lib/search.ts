import type { CollectionMeta, SearchGroup, SearchOccurrence, WordStatus } from "@/lib/types";

export function normalizeSearch(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR").replace(/[\u3041-\u3096]/g, (character) => String.fromCharCode(character.charCodeAt(0) + 0x60));
}

function occurrenceScore(occurrence: SearchOccurrence, query: string): number | null {
  const term = normalizeSearch(occurrence.term);
  const reading = normalizeSearch(occurrence.reading ?? "");
  const meanings = [...occurrence.meanings, occurrence.primaryMeaning ?? ""].map(normalizeSearch);
  if (term === query) return 0;
  if (reading === query) return 1;
  if (term.startsWith(query)) return 2;
  if (reading.startsWith(query)) return 3;
  if (term.includes(query)) return 4;
  if (reading.includes(query)) return 5;
  if (meanings.some((meaning) => meaning.startsWith(query))) return 6;
  if (meanings.some((meaning) => meaning.includes(query))) return 7;
  return null;
}

export interface SearchFilters {
  collectionIds?: Set<string>;
  category?: string;
  jlptLevel?: string;
  status?: WordStatus | "all";
}

export function searchGroups(occurrences: SearchOccurrence[], queryValue: string, filters: SearchFilters, collections: CollectionMeta[]): SearchGroup[] {
  const query = normalizeSearch(queryValue);
  if (!query) return [];
  const categories = new Map(collections.map((item) => [item.id, item.category]));
  const groups = new Map<string, SearchGroup>();
  occurrences.forEach((occurrence, index) => {
    if (filters.collectionIds?.size && !filters.collectionIds.has(occurrence.collectionId)) return;
    if (filters.category && categories.get(occurrence.collectionId) !== filters.category) return;
    if (filters.jlptLevel === "unmarked" ? occurrence.jlptLevels.length > 0 : filters.jlptLevel && !occurrence.jlptLevels.includes(filters.jlptLevel)) return;
    if (filters.status && filters.status !== "all" && occurrence.status !== filters.status) return;
    const score = occurrenceScore(occurrence, query);
    if (score === null) return;
    const existing = groups.get(occurrence.wordId);
    if (existing) {
      existing.occurrences.push(occurrence);
      existing.score = Math.min(existing.score, score);
    } else {
      groups.set(occurrence.wordId, { wordId: occurrence.wordId, representative: occurrence, occurrences: [occurrence], score, firstOrder: index });
    }
  });
  return [...groups.values()].sort((a, b) => a.score - b.score || a.firstOrder - b.firstOrder);
}

export function groupAllOccurrences(occurrences: SearchOccurrence[]): SearchGroup[] {
  const groups = new Map<string, SearchGroup>();
  occurrences.forEach((occurrence, index) => {
    const existing = groups.get(occurrence.wordId);
    if (existing) existing.occurrences.push(occurrence);
    else groups.set(occurrence.wordId, { wordId: occurrence.wordId, representative: occurrence, occurrences: [occurrence], score: 0, firstOrder: index });
  });
  return [...groups.values()];
}
