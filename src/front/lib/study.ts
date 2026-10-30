import type { ProgressState, StudyCard, WordBook } from "@/lib/types";

export interface StudyOptions {
  includeReview: boolean;
  mode: "all" | "unseen" | "due";
  now?: Date;
}

export const canRateCard = (_revealed: boolean, alreadyRated: boolean) => !alreadyRated;

export function buildStudyCards(books: WordBook[], progress: ProgressState, options: StudyOptions): StudyCard[] {
  const now = (options.now ?? new Date()).getTime();
  const groups = new Map<string, StudyCard>();
  for (const book of books) {
    for (const word of book.words) {
      const existing = groups.get(word.id);
      if (existing) existing.occurrences.push({ word, book });
      else groups.set(word.id, { wordId: word.id, representative: { word, book }, occurrences: [{ word, book }] });
    }
  }
  return [...groups.values()].filter((card) => {
    const ready = card.occurrences.find((item) => item.word.status === "ready");
    if (ready) card.representative = ready;
    else if (!options.includeReview) return false;
    const record = progress.records[card.wordId];
    if (options.mode === "unseen" && record) return false;
    if (options.mode === "due" && (!record?.dueAt || Date.parse(record.dueAt) > now)) return false;
    return true;
  });
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const target = state % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function shuffleNewRound<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  if (result.length > 1 && result.every((item, index) => item === items[index])) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}
