import type { N1Word } from "../../data/vocabulary/n1Words";
import type { N1SetProgress } from "./n1FlashcardStorage";

export type SwipeClass = "" | "swipe-left" | "swipe-right";

export interface N1SetSummary {
  doneCount: number;
  index: number;
  isComplete: boolean;
  totalCount: number;
}

export function shuffleWords(words: readonly N1Word[]): N1Word[] {
  const shuffled = [...words];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function getSetCount(
  words: readonly N1Word[],
  setSize: number,
): number {
  return Math.max(1, Math.ceil(words.length / setSize));
}

export function getSetWords(
  words: readonly N1Word[],
  setIndex: number,
  setSize: number,
): readonly N1Word[] {
  return words.slice(setIndex * setSize, (setIndex + 1) * setSize);
}

export function buildSetSummaries(
  words: readonly N1Word[],
  setSize: number,
  setProgress: Record<string, N1SetProgress>,
): readonly N1SetSummary[] {
  const setCount = getSetCount(words, setSize);

  return Array.from({ length: setCount }, (_, index) => {
    const totalCount = getSetWords(words, index, setSize).length;
    const doneCount = Math.min(
      setProgress[String(index)]?.wordIndex ?? 0,
      totalCount,
    );

    return {
      doneCount,
      index,
      isComplete: totalCount > 0 && doneCount >= totalCount,
      totalCount,
    };
  });
}

export function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}
