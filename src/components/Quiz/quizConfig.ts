import type { QuizMode } from "../../types/quiz";

export const QUIZ_SET_SIZE = 20;
export const NI_GRAMMAR_SET_ID = "ni-grammar";
export const MONO_KOTO_GRAMMAR_SET_ID = "mono-koto-grammar";
const GROUPED_SET_COUNT = 3;

export type QuizScope = "all" | "favorites";

export interface QuizSetOption {
  id: string;
  label: string;
  rangeLabel: string;
  setIndex: number;
  setSize: number;
  isCustom?: boolean;
}

export interface CustomQuizSetOption {
  id: string;
  label: string;
  questionCount: number;
}

export function buildQuizSetOptions(
  questionCount: number,
  customSets: readonly CustomQuizSetOption[] = [],
): QuizSetOption[] {
  const options: QuizSetOption[] = [];
  const setCount = Math.ceil(questionCount / QUIZ_SET_SIZE);
  const groupedSetSize = QUIZ_SET_SIZE * GROUPED_SET_COUNT;

  for (let setIndex = 0; setIndex < setCount; setIndex += 1) {
    const startNumber = setIndex * QUIZ_SET_SIZE + 1;
    const endNumber = Math.min((setIndex + 1) * QUIZ_SET_SIZE, questionCount);

    options.push({
      id: `standard-${setIndex}`,
      label: `${setIndex + 1}세트`,
      rangeLabel: `${startNumber}-${endNumber}`,
      setIndex,
      setSize: QUIZ_SET_SIZE,
    });

    if ((setIndex + 1) % GROUPED_SET_COUNT === 0) {
      const groupedSetIndex = Math.floor(setIndex / GROUPED_SET_COUNT);
      const groupedStartNumber = groupedSetIndex * groupedSetSize + 1;
      const groupedEndNumber = Math.min(
        (groupedSetIndex + 1) * groupedSetSize,
        questionCount,
      );

      options.push({
        id: `grouped-${groupedSetIndex}`,
        label: "묶음 세트",
        rangeLabel: `${groupedStartNumber}-${groupedEndNumber}`,
        setIndex: groupedSetIndex,
        setSize: groupedSetSize,
      });
    }
  }

  if (questionCount > 0) {
    options.push({
      id: "all",
      label: "전체 세트",
      rangeLabel: `1-${questionCount}`,
      setIndex: 0,
      setSize: questionCount,
    });
  }

  customSets.forEach((customSet) => {
    if (customSet.questionCount <= 0) {
      return;
    }

    options.push({
      id: customSet.id,
      label: customSet.label,
      rangeLabel: `${customSet.questionCount}문법`,
      setIndex: 0,
      setSize: customSet.questionCount,
      isCustom: true,
    });
  });

  return options;
}

export function usesSelectableSets(mode: QuizMode): boolean {
  return (
    mode === "meaning" ||
    mode === "grammar" ||
    mode === "example" ||
    mode === "sentenceOrder" ||
    mode === "recall"
  );
}

export function buildQuizStorageKey(
  mode: QuizMode,
  scope: QuizScope,
  favoriteIds: readonly string[],
): string {
  const scopeKey =
    scope === "favorites" ? [...favoriteIds].sort().join(",") || "empty" : "all";

  return `jlpt-quiz-session:${mode}:${scope}:${scopeKey}`;
}
