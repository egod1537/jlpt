import type {
  AnswerResult,
  QuizQuestion,
  QuizSessionState,
  UserAnswer,
  WrongAnswerRecord,
} from "../../types/quiz";
import {
  getQuizQuestionCount,
  getReviewQuestions,
} from "../../utils/quizSetBuilder";
import {
  clearPersistedQuizSession,
  loadPersistedQuizSession,
  savePersistedQuizSession,
} from "../../utils/quizSessionStorage";
import {
  buildWrongAnswerRecord,
  evaluateAnswer,
} from "./quizAnswerEvaluator";
import {
  createNormalQuizSessionState,
  restoreQuizSessionState,
  withProceedFlag,
} from "./quizSessionState";

export interface QuizSessionOptions {
  storageKey?: string;
  setSize: number;
  questionPool: readonly QuizQuestion[];
}

export class QuizSessionController {
  private readonly questionPool: readonly QuizQuestion[];
  private readonly setSize: number;
  private readonly storageKey?: string;
  private state: QuizSessionState;

  constructor({ storageKey, setSize, questionPool }: QuizSessionOptions) {
    this.storageKey = storageKey;
    this.setSize = setSize;
    this.questionPool = questionPool;

    const persisted = loadPersistedQuizSession(storageKey);
    this.state =
      (persisted === null
        ? null
        : restoreQuizSessionState(persisted, questionPool, setSize)) ??
      createNormalQuizSessionState(questionPool, setSize, 0);

    this.persist();
  }

  getState(): QuizSessionState {
    return this.state;
  }

  getCurrentQuestion(): QuizQuestion | undefined {
    if (this.state.phase === "SET_COMPLETE") {
      return undefined;
    }

    return this.state.currentQuestions[this.state.currentQuestionIndex];
  }

  answerCurrentQuestion(
    answer: UserAnswer,
  ): { result: AnswerResult; state: QuizSessionState } {
    const question = this.getCurrentQuestion();

    if (question === undefined) {
      throw new Error("No active question to answer.");
    }

    const result = evaluateAnswer(question, answer);
    const { isCorrect } = result;

    if (this.state.phase === "NORMAL") {
      if (isCorrect) {
        return {
          result,
          state: this.commit(
            withProceedFlag({
              ...this.state,
              correctCount: this.state.correctCount + 1,
            }),
          ),
        };
      }

      const wrongQueue = this.upsertWrongAnswer(question, answer);
      return {
        result,
        state: this.commit(
          withProceedFlag({
            ...this.state,
            wrongCount: this.state.wrongCount + 1,
            wrongQueue,
          }),
        ),
      };
    }

    if (isCorrect) {
      const wrongQueue = this.state.wrongQueue.filter(
        (record) => record.questionId !== question.id,
      );

      return {
        result,
        state: this.commit(
          withProceedFlag({
            ...this.state,
            phase: wrongQueue.length === 0 ? "SET_COMPLETE" : this.state.phase,
            wrongQueue,
            reviewedCorrectCount: this.state.reviewedCorrectCount + 1,
          }),
        ),
      };
    }

    return {
      result,
      state: this.commit(
        withProceedFlag({
          ...this.state,
          wrongQueue: this.upsertWrongAnswer(question, answer),
          reviewedWrongCount: this.state.reviewedWrongCount + 1,
        }),
      ),
    };
  }

  startReviewSession(): QuizSessionState {
    if (this.state.wrongQueue.length === 0) {
      return this.commit(
        withProceedFlag({ ...this.state, phase: "SET_COMPLETE" }),
      );
    }

    return this.commit(
      withProceedFlag({
        ...this.state,
        phase: "REVIEW",
        currentQuestionIndex: 0,
        currentQuestions: getReviewQuestions(
          this.questionPool,
          this.state.wrongQueue,
        ),
      }),
    );
  }

  goToNextQuestion(): QuizSessionState {
    if (this.state.phase === "SET_COMPLETE") {
      return this.state;
    }

    if (this.state.phase === "NORMAL") {
      const nextQuestionIndex = this.state.currentQuestionIndex + 1;

      return this.commit(
        withProceedFlag({
          ...this.state,
          phase:
            nextQuestionIndex >= this.state.currentQuestions.length
              ? "SET_COMPLETE"
              : this.state.phase,
          currentQuestionIndex:
            nextQuestionIndex >= this.state.currentQuestions.length
              ? this.state.currentQuestions.length
              : nextQuestionIndex,
        }),
      );
    }

    if (this.state.wrongQueue.length === 0) {
      return this.commit(
        withProceedFlag({ ...this.state, phase: "SET_COMPLETE" }),
      );
    }

    const nextQuestionIndex = this.state.currentQuestionIndex + 1;
    const shouldRestartReview =
      nextQuestionIndex >= this.state.currentQuestions.length;

    return this.commit(
      withProceedFlag({
        ...this.state,
        currentQuestionIndex: shouldRestartReview ? 0 : nextQuestionIndex,
        currentQuestions: shouldRestartReview
          ? getReviewQuestions(this.questionPool, this.state.wrongQueue)
          : this.state.currentQuestions,
      }),
    );
  }

  goToNextSet(): QuizSessionState {
    if (this.state.wrongQueue.length > 0) {
      throw new Error(
        "Wrong questions must be reviewed before moving to next set.",
      );
    }

    return this.commit(
      createNormalQuizSessionState(
        this.questionPool,
        this.setSize,
        this.state.currentSetIndex + 1,
        this.state.currentSetSize,
      ),
    );
  }

  startSet(setIndex: number, selectedSetSize = this.setSize): QuizSessionState {
    return this.commit(
      createNormalQuizSessionState(
        this.questionPool,
        this.setSize,
        setIndex,
        selectedSetSize,
      ),
    );
  }

  startCustomSet(
    setId: string,
    questionPool: readonly QuizQuestion[],
  ): QuizSessionState {
    const questionCount = getQuizQuestionCount(questionPool);

    return this.commit({
      ...createNormalQuizSessionState(
        questionPool,
        questionCount,
        0,
        questionCount,
      ),
      currentSetId: setId,
    });
  }

  resetSession(): QuizSessionState {
    clearPersistedQuizSession(this.storageKey);
    return this.commit(
      createNormalQuizSessionState(this.questionPool, this.setSize, 0),
    );
  }

  private upsertWrongAnswer(
    question: QuizQuestion,
    answer: UserAnswer,
  ): WrongAnswerRecord[] {
    const existingRecord = this.state.wrongQueue.find(
      (record) => record.questionId === question.id,
    );
    const nextRecord = buildWrongAnswerRecord(question, answer, existingRecord);

    return existingRecord === undefined
      ? [...this.state.wrongQueue, nextRecord]
      : this.state.wrongQueue.map((record) =>
          record.questionId === question.id ? nextRecord : record,
        );
  }

  private commit(state: QuizSessionState): QuizSessionState {
    this.state = state;
    this.persist();
    return this.state;
  }

  private persist(): void {
    savePersistedQuizSession(this.state, this.storageKey);
  }
}
