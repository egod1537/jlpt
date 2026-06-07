import type { PersistedQuizSession, QuizSessionState } from "../types/quiz";

export const STORAGE_KEY = "jlpt-quiz-session";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function toPersistedQuizSession(state: QuizSessionState): PersistedQuizSession {
  return {
    currentSetIndex: state.currentSetIndex,
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

export function loadPersistedQuizSession(): PersistedQuizSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (rawValue === null) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PersistedQuizSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function savePersistedQuizSession(state: QuizSessionState): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedQuizSession(state)));
}

export function clearPersistedQuizSession(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
