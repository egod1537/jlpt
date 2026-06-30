import { fillBlankQuestions } from "../data/quiz/fillBlankQuestions";
import { sentenceOrderQuestions } from "../data/quiz/sentenceOrderQuestions";
import type { GrammarItem } from "../types/grammar";
import type { QuizMode, QuizQuestion } from "../types/quiz";
import { shuffle } from "./shuffle";
import { buildManualFillBlankQuestion } from "./quiz/fillBlankQuestionFactory";
import {
  generateQuizQuestion,
  quizModes,
} from "./quiz/grammarQuestionFactory";
import { buildManualSentenceOrderQuestion } from "./quiz/sentenceOrderQuestionFactory";

export const QUESTIONS_PER_GRAMMAR = 20;

export {
  buildManualFillBlankQuestion,
  buildManualSentenceOrderQuestion,
  generateQuizQuestion,
  quizModes,
};

export function generateQuizSet(
  mode: QuizMode,
  grammarItems: readonly GrammarItem[],
  count = QUESTIONS_PER_GRAMMAR,
): QuizQuestion[] {
  return shuffle(grammarItems)
    .slice(0, count)
    .map((item) => generateQuizQuestion(mode, item, grammarItems));
}

export function getManualFillBlankQuestions(
  allGrammar: readonly GrammarItem[],
): QuizQuestion[] {
  return fillBlankQuestions.map((question) =>
    buildManualFillBlankQuestion(question, allGrammar),
  );
}

export function getManualSentenceOrderQuestions(): QuizQuestion[] {
  return sentenceOrderQuestions.map(buildManualSentenceOrderQuestion);
}
