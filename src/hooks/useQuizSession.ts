import { useEffect, useMemo, useState } from "react";
import type {
  AnswerResult,
  PersistedQuizSession,
  QuizPhase,
  QuizQuestion,
  QuizSessionState,
  UserAnswer,
  WrongAnswerRecord,
} from "../types/quiz";
import {
  buildQuizSet,
  getQuestionsByIds,
  getQuizQuestionCount,
  getReviewQuestions,
  hasUniqueAnswerGrammars,
  shuffleQuizQuestionChoices,
} from "../utils/quizSetBuilder";
import {
  clearPersistedQuizSession,
  loadPersistedQuizSession,
  savePersistedQuizSession,
} from "../utils/quizSessionStorage";

interface UseQuizSessionOptions {
  setSize: number;
  questionPool: readonly QuizQuestion[];
}

interface UseQuizSessionResult extends QuizSessionState {
  currentQuestion: QuizQuestion | undefined;
  answerCurrentQuestion: (answer: UserAnswer) => AnswerResult;
  startReviewSession: () => void;
  goToNextQuestion: () => void;
  goToNextSet: () => void;
  startSet: (setIndex: number, selectedSetSize?: number) => void;
  resetSession: () => void;
}

function getCorrectAnswer(question: QuizQuestion): string {
  if (question.answerChoiceIds !== undefined) {
    return question.answerChoiceIds
      .map((choiceId) => question.choices.find((choice) => choice.id === choiceId)?.text ?? choiceId)
      .join(" / ");
  }

  return question.choices.find((choice) => choice.id === question.answerChoiceId)?.text ?? question.answerChoiceId;
}

function buildWrongAnswerRecord(
  question: QuizQuestion,
  answer: UserAnswer,
  existingRecord?: WrongAnswerRecord,
): WrongAnswerRecord {
  return {
    questionId: question.id,
    selectedChoiceId: answer.selectedChoiceId,
    selectedChoiceIds: answer.selectedChoiceIds ?? answer.selectedPieceIds,
    selectedPieceIds: answer.selectedPieceIds,
    inputAnswer: answer.inputAnswer,
    correctAnswer: getCorrectAnswer(question),
    answeredAt: new Date().toISOString(),
    attemptCount: (existingRecord?.attemptCount ?? 0) + 1,
  };
}

function isAnswerCorrect(question: QuizQuestion, answer: UserAnswer): boolean {
  const selectedChoiceIds = answer.selectedChoiceIds ?? answer.selectedPieceIds;

  if (question.answerChoiceIds !== undefined) {
    return (
      selectedChoiceIds !== undefined &&
      question.answerChoiceIds.length === selectedChoiceIds.length &&
      question.answerChoiceIds.every((choiceId, index) => choiceId === selectedChoiceIds[index])
    );
  }

  if (answer.selectedChoiceId !== undefined) {
    return answer.selectedChoiceId === question.answerChoiceId;
  }

  if (answer.inputAnswer !== undefined) {
    return answer.inputAnswer.trim() === getCorrectAnswer(question).trim();
  }

  return false;
}

function withProceedFlag(state: Omit<QuizSessionState, "canProceedToNextSet">): QuizSessionState {
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

  const totalSets = Math.max(1, Math.ceil(getQuizQuestionCount(questionPool) / setSize));

  return currentSetIndex % totalSets;
}

function createNormalState(
  questionPool: readonly QuizQuestion[],
  baseSetSize: number,
  currentSetIndex: number,
  currentSetSize = baseSetSize,
): QuizSessionState {
  const normalizedSetIndex = normalizeSetIndex(questionPool, currentSetSize, currentSetIndex);

  return withProceedFlag({
    currentSetIndex: normalizedSetIndex,
    currentSetSize,
    phase: "NORMAL",
    currentQuestionIndex: 0,
    currentQuestions: buildQuizSet(questionPool, currentSetSize, normalizedSetIndex),
    wrongQueue: [],
    correctCount: 0,
    wrongCount: 0,
    reviewedCorrectCount: 0,
    reviewedWrongCount: 0,
  });
}

function clampQuestionIndex(index: number, questions: readonly QuizQuestion[]): number {
  if (questions.length === 0) {
    return 0;
  }

  return Math.max(0, Math.min(index, questions.length - 1));
}

function getValidWrongQueue(
  persisted: PersistedQuizSession,
  questionById: ReadonlyMap<string, QuizQuestion>,
): WrongAnswerRecord[] {
  return persisted.wrongQueue.filter((record) => questionById.has(record.questionId));
}

function restoreState(
  persisted: PersistedQuizSession,
  questionPool: readonly QuizQuestion[],
  setSize: number,
): QuizSessionState | null {
  const questionById = new Map(questionPool.map((question) => [question.id, question]));
  const wrongQueue = getValidWrongQueue(persisted, questionById);
  const persistedQuestions = getQuestionsByIds(questionPool, persisted.currentQuestionIds).map(
    shuffleQuizQuestionChoices,
  );
  const currentSetSize = persisted.currentSetSize ?? setSize;

  if (persistedQuestions.length === 0) {
    return null;
  }

  if (currentSetSize <= setSize && !hasUniqueAnswerGrammars(persistedQuestions)) {
    return null;
  }

  const phase: QuizPhase =
    persisted.phase === "REVIEW" && wrongQueue.length === 0 ? "SET_COMPLETE" : persisted.phase;
  const currentQuestions =
    phase === "REVIEW" ? persistedQuestions.filter((question) => wrongQueue.some((record) => record.questionId === question.id)) : persistedQuestions;
  const restoredQuestions =
    phase === "REVIEW" && currentQuestions.length === 0 ? getReviewQuestions(questionPool, wrongQueue) : currentQuestions;

  if (restoredQuestions.length === 0 && phase !== "SET_COMPLETE") {
    return createNormalState(questionPool, setSize, persisted.currentSetIndex, currentSetSize);
  }

  const currentSetIndex = normalizeSetIndex(questionPool, currentSetSize, persisted.currentSetIndex);

  return withProceedFlag({
    currentSetIndex,
    currentSetSize,
    phase,
    currentQuestionIndex: clampQuestionIndex(persisted.currentQuestionIndex, restoredQuestions),
    currentQuestions: restoredQuestions,
    wrongQueue,
    correctCount: persisted.correctCount,
    wrongCount: persisted.wrongCount,
    reviewedCorrectCount: persisted.reviewedCorrectCount,
    reviewedWrongCount: persisted.reviewedWrongCount,
  });
}

export function useQuizSession({ setSize, questionPool }: UseQuizSessionOptions): UseQuizSessionResult {
  const questionById = useMemo(() => new Map(questionPool.map((question) => [question.id, question])), [questionPool]);

  const [state, setState] = useState<QuizSessionState>(() => {
    const persisted = loadPersistedQuizSession();
    const restored = persisted === null ? null : restoreState(persisted, questionPool, setSize);

    return restored ?? createNormalState(questionPool, setSize, 0);
  });

  useEffect(() => {
    savePersistedQuizSession(state);
  }, [state]);

  const currentQuestion = state.phase === "SET_COMPLETE" ? undefined : state.currentQuestions[state.currentQuestionIndex];

  const answerCurrentQuestion = (answer: UserAnswer): AnswerResult => {
    const question = state.currentQuestions[state.currentQuestionIndex];

    if (question === undefined || state.phase === "SET_COMPLETE") {
      throw new Error("No active question to answer.");
    }

    const isCorrect = isAnswerCorrect(question, answer);
    const result: AnswerResult = {
      isCorrect,
      selectedChoiceId: answer.selectedChoiceId,
      selectedChoiceIds: answer.selectedChoiceIds ?? answer.selectedPieceIds,
      selectedPieceIds: answer.selectedPieceIds,
      inputAnswer: answer.inputAnswer,
      correctAnswer: getCorrectAnswer(question),
      explanation: question.explanation,
    };

    setState((currentState) => {
      const activeQuestion = currentState.currentQuestions[currentState.currentQuestionIndex];

      if (activeQuestion === undefined || currentState.phase === "SET_COMPLETE") {
        return currentState;
      }

      if (currentState.phase === "NORMAL") {
        if (isCorrect) {
          return withProceedFlag({
            ...currentState,
            correctCount: currentState.correctCount + 1,
          });
        }

        const existingRecord = currentState.wrongQueue.find((record) => record.questionId === activeQuestion.id);
        const nextRecord = buildWrongAnswerRecord(activeQuestion, answer, existingRecord);
        const wrongQueue =
          existingRecord === undefined
            ? [...currentState.wrongQueue, nextRecord]
            : currentState.wrongQueue.map((record) => (record.questionId === activeQuestion.id ? nextRecord : record));

        return withProceedFlag({
          ...currentState,
          wrongCount: currentState.wrongCount + 1,
          wrongQueue,
        });
      }

      if (isCorrect) {
        const wrongQueue = currentState.wrongQueue.filter((record) => record.questionId !== activeQuestion.id);

        return withProceedFlag({
          ...currentState,
          phase: wrongQueue.length === 0 ? "SET_COMPLETE" : currentState.phase,
          wrongQueue,
          reviewedCorrectCount: currentState.reviewedCorrectCount + 1,
        });
      }

      const existingRecord = currentState.wrongQueue.find((record) => record.questionId === activeQuestion.id);
      const nextRecord = buildWrongAnswerRecord(activeQuestion, answer, existingRecord);
      const wrongQueue =
        existingRecord === undefined
          ? [...currentState.wrongQueue, nextRecord]
          : currentState.wrongQueue.map((record) => (record.questionId === activeQuestion.id ? nextRecord : record));

      return withProceedFlag({
        ...currentState,
        wrongQueue,
        reviewedWrongCount: currentState.reviewedWrongCount + 1,
      });
    });

    return result;
  };

  const startReviewSession = () => {
    setState((currentState) => {
      if (currentState.wrongQueue.length === 0) {
        return withProceedFlag({
          ...currentState,
          phase: "SET_COMPLETE",
        });
      }

      return withProceedFlag({
        ...currentState,
        phase: "REVIEW",
        currentQuestionIndex: 0,
        currentQuestions: getReviewQuestions(questionPool, currentState.wrongQueue),
      });
    });
  };

  const goToNextQuestion = () => {
    setState((currentState) => {
      if (currentState.phase === "SET_COMPLETE") {
        return currentState;
      }

      if (currentState.phase === "NORMAL") {
        const nextQuestionIndex = currentState.currentQuestionIndex + 1;

        if (nextQuestionIndex >= currentState.currentQuestions.length) {
          return withProceedFlag({
            ...currentState,
            phase: "SET_COMPLETE",
            currentQuestionIndex: currentState.currentQuestions.length,
          });
        }

        return withProceedFlag({
          ...currentState,
          currentQuestionIndex: nextQuestionIndex,
        });
      }

      if (currentState.wrongQueue.length === 0) {
        return withProceedFlag({
          ...currentState,
          phase: "SET_COMPLETE",
        });
      }

      const nextQuestionIndex = currentState.currentQuestionIndex + 1;

      if (nextQuestionIndex >= currentState.currentQuestions.length) {
        return withProceedFlag({
          ...currentState,
          currentQuestionIndex: 0,
          currentQuestions: getReviewQuestions(questionPool, currentState.wrongQueue),
        });
      }

      return withProceedFlag({
        ...currentState,
        currentQuestionIndex: nextQuestionIndex,
      });
    });
  };

  const goToNextSet = () => {
    if (state.wrongQueue.length > 0) {
      throw new Error("Wrong questions must be reviewed before moving to next set.");
    }

    setState((currentState) =>
      createNormalState(
        questionPool,
        setSize,
        currentState.currentSetIndex + 1,
        currentState.currentSetSize,
      ),
    );
  };

  const startSet = (setIndex: number, selectedSetSize = setSize) => {
    setState(createNormalState(questionPool, setSize, setIndex, selectedSetSize));
  };

  const resetSession = () => {
    clearPersistedQuizSession();
    setState(createNormalState(questionPool, setSize, 0));
  };

  const validWrongQueue = state.wrongQueue.filter((record) => questionById.has(record.questionId));
  const normalizedState =
    validWrongQueue.length === state.wrongQueue.length
      ? state
      : withProceedFlag({
          ...state,
          wrongQueue: validWrongQueue,
        });

  return {
    ...normalizedState,
    currentQuestion,
    answerCurrentQuestion,
    startReviewSession,
    goToNextQuestion,
    goToNextSet,
    startSet,
    resetSession,
  };
}
