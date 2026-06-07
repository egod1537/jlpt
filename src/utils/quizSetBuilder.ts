import type { GrammarItem } from "../types/grammar";
import type { QuizMode, QuizQuestion, WrongAnswerRecord } from "../types/quiz";
import { generateQuizQuestion } from "./quizGenerator";
import { shuffle } from "./shuffle";

export function buildGrammarQuestionPool(
  mode: QuizMode,
  grammarItems: readonly GrammarItem[],
): QuizQuestion[] {
  return grammarItems.map((item) => generateQuizQuestion(mode, item, grammarItems));
}

export function buildQuizSet(questionPool: readonly QuizQuestion[], setSize: number): QuizQuestion[] {
  return shuffle(questionPool).slice(0, setSize);
}

export function getQuestionsByIds(
  questionPool: readonly QuizQuestion[],
  questionIds: readonly string[],
): QuizQuestion[] {
  const questionById = new Map(questionPool.map((question) => [question.id, question]));

  return questionIds
    .map((questionId) => questionById.get(questionId))
    .filter((question): question is QuizQuestion => question !== undefined);
}

export function getReviewQuestions(
  questionPool: readonly QuizQuestion[],
  wrongQueue: readonly WrongAnswerRecord[],
): QuizQuestion[] {
  return shuffle(getQuestionsByIds(questionPool, wrongQueue.map((record) => record.questionId)));
}
