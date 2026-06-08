import type { GrammarItem } from "../types/grammar";
import type { QuizMode, QuizQuestion, WrongAnswerRecord } from "../types/quiz";
import { generateQuizQuestion, getManualFillBlankQuestions, getManualSentenceOrderQuestions } from "./quizGenerator";
import { shuffle } from "./shuffle";

export function buildGrammarQuestionPool(
  mode: QuizMode,
  grammarItems: readonly GrammarItem[],
): QuizQuestion[] {
  const generatedQuestions = grammarItems.map((item) => generateQuizQuestion(mode, item, grammarItems));

  if (mode === "example") {
    return [...getManualFillBlankQuestions(grammarItems), ...generatedQuestions];
  }

  if (mode === "sentenceOrder") {
    const manualQuestions = getManualSentenceOrderQuestions();

    return manualQuestions.length > 0 ? manualQuestions : generatedQuestions;
  }

  return generatedQuestions;
}

function shouldUseSequentialSets(questionPool: readonly QuizQuestion[]): boolean {
  const quizType = questionPool[0]?.type;

  return quizType === "GRAMMAR_MEANING" || quizType === "GRAMMAR_SELECT";
}

export function buildQuizSet(
  questionPool: readonly QuizQuestion[],
  setSize: number,
  currentSetIndex = 0,
): QuizQuestion[] {
  if (shouldUseSequentialSets(questionPool)) {
    const totalSets = Math.max(1, Math.ceil(questionPool.length / setSize));
    const normalizedSetIndex = currentSetIndex % totalSets;
    const startIndex = normalizedSetIndex * setSize;

    return questionPool.slice(startIndex, startIndex + setSize);
  }

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
