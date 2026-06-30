import type { PersistedQuizSession, QuizSessionState } from "../types/quiz";

export const STORAGE_KEY = "jlpt-quiz-session";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function toPersistedQuizSession(state: QuizSessionState): PersistedQuizSession {
  return {
    currentSetId: state.currentSetId,
    currentSetIndex: state.currentSetIndex,
    currentSetSize: state.currentSetSize,
    phase: state.phase,
    currentQuestionIndex: state.currentQuestionIndex,
    currentQuestionIds: state.currentQuestions.map((question) => question.id),
    wrongQueue: state.wrongQueue,
    correctCount: state.correctCount,
    wrongCount: state.wrongCount,
    reviewedCorrectCount: state.reviewedCorrectCount,
    reviewedWrongCount: state.reviewedWrongCount,
  };
}

export function loadPersistedQuizSession(storageKey = STORAGE_KEY): PersistedQuizSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(storageKey);

  if (rawValue === null) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PersistedQuizSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function savePersistedQuizSession(
  state: QuizSessionState,
  storageKey = STORAGE_KEY,
): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(toPersistedQuizSession(state)));
}

export function clearPersistedQuizSession(storageKey = STORAGE_KEY): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(storageKey);
}
