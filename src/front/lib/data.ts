import type { CollectionIndex, ReviewIndex, SearchIndex, SiteStats, Word, WordBook } from "@/lib/types";

const wordIdPattern = /^word-[a-f0-9]{12}$/;
const bookIdPattern = /^session-\d{3}$/;

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} 데이터 형식이 올바르지 않습니다.`);
  return value as Record<string, unknown>;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} 목록 형식이 올바르지 않습니다.`);
  return value;
}

export function parseCollectionIndex(value: unknown): CollectionIndex {
  const data = object(value, "단어장");
  const collections = array(data.collections, "단어장");
  if (typeof data.schemaVersion !== "string" || typeof data.generatedAt !== "string" || typeof data.total !== "number" || data.total !== collections.length) throw new Error("단어장 인덱스가 손상되었습니다.");
  for (const entry of collections) {
    const item = object(entry, "단어장 항목");
    if (typeof item.id !== "string" || !bookIdPattern.test(item.id) || typeof item.title !== "string" || typeof item.category !== "string" || typeof item.wordCount !== "number") throw new Error("단어장 메타데이터가 손상되었습니다.");
  }
  return value as CollectionIndex;
}

export function parseWordBook(value: unknown): WordBook {
  const data = object(value, "단어장");
  const words = array(data.words, "단어");
  if (typeof data.id !== "string" || !bookIdPattern.test(data.id) || typeof data.title !== "string" || typeof data.total !== "number" || data.total !== words.length) throw new Error("단어장 파일이 손상되었습니다.");
  for (const entry of words) {
    const word = object(entry, "단어");
    if (typeof word.id !== "string" || !wordIdPattern.test(word.id) || typeof word.term !== "string" || !Array.isArray(word.meanings) || (word.status !== "ready" && word.status !== "needs-review")) throw new Error("단어 항목이 손상되었습니다.");
  }
  return value as WordBook;
}

export function parseStats(value: unknown): SiteStats {
  const data = object(value, "통계");
  for (const key of ["wordbookFiles", "wordEntries", "uniqueAcrossWordbooks", "readyEntries", "needsReviewEntries"]) if (typeof data[key] !== "number") throw new Error("통계 데이터가 손상되었습니다.");
  return value as SiteStats;
}

export function parseReviewIndex(value: unknown): ReviewIndex {
  const data = object(value, "검수");
  const items = array(data.items, "검수");
  if (typeof data.total !== "number" || data.total !== items.length) throw new Error("검수 데이터가 손상되었습니다.");
  return value as ReviewIndex;
}

export function parseSearchIndex(value: unknown): SearchIndex {
  const data = object(value, "검색");
  const occurrences = array(data.occurrences, "검색");
  if (typeof data.total !== "number" || data.total !== occurrences.length) throw new Error("검색 인덱스가 손상되었습니다.");
  return value as SearchIndex;
}

const requestCache = new Map<string, Promise<unknown>>();

async function fetchUnknown(path: string): Promise<unknown> {
  if (!requestCache.has(path)) {
    requestCache.set(path, fetch(path, { cache: "force-cache" }).then(async (response) => {
      if (!response.ok) throw new Error(`${path}을 불러오지 못했습니다 (${response.status}).`);
      return response.json() as Promise<unknown>;
    }).catch((error) => {
      requestCache.delete(path);
      throw error;
    }));
  }
  return requestCache.get(path)!;
}

export const getCollections = async () => parseCollectionIndex(await fetchUnknown("/data/collections.json"));
export const getStats = async () => parseStats(await fetchUnknown("/data/stats.json"));
export const getReviewIndex = async () => parseReviewIndex(await fetchUnknown("/data/review.json"));
export const getSearchIndex = async () => parseSearchIndex(await fetchUnknown("/data/search-index.json"));

export async function getBook(collectionId: string): Promise<WordBook> {
  const index = await getCollections();
  if (!index.collections.some((item) => item.id === collectionId)) throw new Error("존재하지 않는 단어장입니다.");
  return parseWordBook(await fetchUnknown(`/data/wordbooks/${encodeURIComponent(collectionId)}.json`));
}

export function wordMatches(word: Word, query: string): boolean {
  const normalized = query.normalize("NFKC").trim().toLocaleLowerCase("ko-KR");
  if (!normalized) return true;
  return [word.term, word.reading ?? "", ...word.meanings, word.primaryMeaning ?? ""].some((value) => value.normalize("NFKC").toLocaleLowerCase("ko-KR").includes(normalized));
}
