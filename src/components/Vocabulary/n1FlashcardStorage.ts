import type { N1Word } from "../../data/vocabulary/n1Words";

const STORAGE_KEY = "jlpt-n1-flashcards:v1";

export interface N1SetProgress {
  elapsedSeconds: number;
  knowWordIds: number[];
  studyWordIds: number[];
  wordIndex: number;
}

export interface N1FlashcardSession {
  currentSetIndex: number;
  setProgress: Record<string, N1SetProgress>;
  shuffledWordIds: number[];
}

export function createN1FlashcardSession(
  currentSetIndex: number,
  shuffledWords: readonly N1Word[],
  setProgress: Record<string, N1SetProgress> = {},
): N1FlashcardSession {
  return {
    currentSetIndex,
    setProgress,
    shuffledWordIds: shuffledWords.map((word) => word.n),
  };
}

export function loadN1FlashcardSession(): N1FlashcardSession | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(STORAGE_KEY);

    if (rawSession === null) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as Partial<N1FlashcardSession>;

    if (
      !Array.isArray(parsed.shuffledWordIds) ||
      typeof parsed.currentSetIndex !== "number" ||
      parsed.setProgress === undefined ||
      parsed.setProgress === null
    ) {
      return null;
    }

    return {
      currentSetIndex: parsed.currentSetIndex,
      setProgress: normalizeSetProgress(parsed.setProgress),
      shuffledWordIds: parsed.shuffledWordIds.filter(
        (wordId): wordId is number => typeof wordId === "number",
      ),
    };
  } catch {
    return null;
  }
}

export function saveN1FlashcardSession(session: N1FlashcardSession): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function restoreShuffledWords(
  words: readonly N1Word[],
  shuffledWordIds: readonly number[],
): readonly N1Word[] | null {
  if (words.length !== shuffledWordIds.length) {
    return null;
  }

  const wordById = buildWordById(words);
  const restoredWords = shuffledWordIds
    .map((wordId) => wordById.get(wordId))
    .filter((word): word is N1Word => word !== undefined);

  return restoredWords.length === words.length ? restoredWords : null;
}

export function buildWordById(
  words: readonly N1Word[],
): ReadonlyMap<number, N1Word> {
  return new Map(words.map((word) => [word.n, word]));
}

export function mapWordIdsToWords(
  wordIds: readonly number[],
  wordById: ReadonlyMap<number, N1Word>,
): readonly N1Word[] {
  return wordIds
    .map((wordId) => wordById.get(wordId))
    .filter((word): word is N1Word => word !== undefined);
}

function normalizeSetProgress(
  value: Record<string, unknown>,
): Record<string, N1SetProgress> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([setIndex, progress]) => {
      if (progress === null || typeof progress !== "object") {
        return [];
      }

      const candidate = progress as Partial<N1SetProgress>;

      return [
        [
          setIndex,
          {
            elapsedSeconds:
              typeof candidate.elapsedSeconds === "number"
                ? candidate.elapsedSeconds
                : 0,
            knowWordIds: normalizeWordIds(candidate.knowWordIds),
            studyWordIds: normalizeWordIds(candidate.studyWordIds),
            wordIndex:
              typeof candidate.wordIndex === "number"
                ? Math.max(0, candidate.wordIndex)
                : 0,
          },
        ],
      ];
    }),
  );
}

function normalizeWordIds(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((wordId): wordId is number => typeof wordId === "number")
    : [];
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && window.localStorage !== undefined;
}
