import type {
  PersistedQuizSession,
  QuizPhase,
  QuizQuestion,
  QuizSessionState,
} from "../../types/quiz";
import {
  buildQuizSet,
  getQuestionsByIds,
  getQuizQuestionCount,
  getReviewQuestions,
  hasUniqueAnswerGrammars,
  shuffleQuizQuestionChoices,
} from "../../utils/quizSetBuilder";

export function withProceedFlag(
  state: Omit<QuizSessionState, "canProceedToNextSet">,
): QuizSessionState {
  return {
    ...state,
    canProceedToNextSet: state.wrongQueue.length === 0,
  };
}

function shouldNormalizeSetIndex(questionPool: readonly QuizQuestion[]): boolean {
  const quizType = questionPool[0]?.type;

  return (
    quizType === "GRAMMAR_MEANING" ||
    quizType === "GRAMMAR_SELECT" ||
    quizType === "GRAMMAR_RECALL" ||
    quizType === "EXAMPLE_BLANK" ||
    quizType === "SENTENCE_ORDER"
  );
}

function normalizeSetIndex(
  questionPool: readonly QuizQuestion[],
  setSize: number,
  currentSetIndex: number,
): number {
  if (!shouldNormalizeSetIndex(questionPool)) {
    return currentSetIndex;
  }

  const totalSets = Math.max(
    1,
    Math.ceil(getQuizQuestionCount(questionPool) / setSize),
  );
  return currentSetIndex % totalSets;
}

export function createNormalQuizSessionState(
  questionPool: readonly QuizQuestion[],
  baseSetSize: number,
  currentSetIndex: number,
  currentSetSize = baseSetSize,
): QuizSessionState {
  const normalizedSetIndex = normalizeSetIndex(
    questionPool,
    currentSetSize,
    currentSetIndex,
  );

  return withProceedFlag({
    currentSetIndex: normalizedSetIndex,
    currentSetSize,
    phase: "NORMAL",
    currentQuestionIndex: 0,
    currentQuestions: buildQuizSet(
      questionPool,
      currentSetSize,
      normalizedSetIndex,
    ),
    wrongQueue: [],
    correctCount: 0,
    wrongCount: 0,
    reviewedCorrectCount: 0,
    reviewedWrongCount: 0,
  });
}

function clampQuestionIndex(
  index: number,
  questions: readonly QuizQuestion[],
): number {
  if (questions.length === 0) {
    return 0;
  }

  return Math.max(0, Math.min(index, questions.length - 1));
}

export function restoreQuizSessionState(
  persisted: PersistedQuizSession,
  questionPool: readonly QuizQuestion[],
  setSize: number,
): QuizSessionState | null {
  const questionById = new Map(
    questionPool.map((question) => [question.id, question]),
  );
  const wrongQueue = persisted.wrongQueue.filter((record) =>
    questionById.has(record.questionId),
  );
  const persistedQuestions = getQuestionsByIds(
    questionPool,
    persisted.currentQuestionIds,
  ).map(shuffleQuizQuestionChoices);
  const currentSetSize = persisted.currentSetSize ?? setSize;

  if (persistedQuestions.length === 0) {
    return null;
  }

  if (currentSetSize <= setSize && !hasUniqueAnswerGrammars(persistedQuestions)) {
    return null;
  }

  const phase: QuizPhase =
    persisted.phase === "REVIEW" && wrongQueue.length === 0
      ? "SET_COMPLETE"
      : persisted.phase;
  const currentQuestions =
    phase === "REVIEW"
      ? persistedQuestions.filter((question) =>
          wrongQueue.some((record) => record.questionId === question.id),
        )
      : persistedQuestions;
  const restoredQuestions =
    phase === "REVIEW" && currentQuestions.length === 0
      ? getReviewQuestions(questionPool, wrongQueue)
      : currentQuestions;

  if (restoredQuestions.length === 0 && phase !== "SET_COMPLETE") {
    return createNormalQuizSessionState(
      questionPool,
      setSize,
      persisted.currentSetIndex,
      currentSetSize,
    );
  }

  return withProceedFlag({
    currentSetId: persisted.currentSetId,
    currentSetIndex: normalizeSetIndex(
      questionPool,
      currentSetSize,
      persisted.currentSetIndex,
    ),
    currentSetSize,
    phase,
    currentQuestionIndex: clampQuestionIndex(
      persisted.currentQuestionIndex,
      restoredQuestions,
    ),
    currentQuestions: restoredQuestions,
    wrongQueue,
    correctCount: persisted.correctCount,
    wrongCount: persisted.wrongCount,
    reviewedCorrectCount: persisted.reviewedCorrectCount,
    reviewedWrongCount: persisted.reviewedWrongCount,
  });
}
