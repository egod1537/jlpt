import type { GrammarItem } from "../../types/grammar";
import type { QuizMode, QuizQuestion } from "../../types/quiz";
import {
  generateQuizQuestion,
  getManualFillBlankQuestions,
  getManualSentenceOrderQuestions,
} from "../quizGenerator";

export function buildGrammarQuestionPool(
  mode: QuizMode,
  grammarItems: readonly GrammarItem[],
): QuizQuestion[] {
  if (mode === "example") {
    const allowedGrammarIds = new Set(grammarItems.map((item) => item.id));
    const createdQuestions = getManualFillBlankQuestions(grammarItems).filter(
      (question) =>
        question.id.startsWith("fb-created-") &&
        question.sourceGrammarId !== undefined &&
        allowedGrammarIds.has(question.sourceGrammarId),
    );

    if (createdQuestions.length > 0) {
      return createdQuestions;
    }
  }

  if (mode === "sentenceOrder") {
    const allowedGrammarIds = new Set(grammarItems.map((item) => item.id));
    const createdQuestions = getManualSentenceOrderQuestions().filter(
      (question) =>
        question.id.startsWith("so-created-") &&
        question.sourceGrammarId !== undefined &&
        allowedGrammarIds.has(question.sourceGrammarId),
    );

    if (createdQuestions.length > 0) {
      return createdQuestions;
    }
  }

  return grammarItems.map((item) =>
    generateQuizQuestion(mode, item, grammarItems),
  );
}
