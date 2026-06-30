import type { QuizQuestion } from "../../types/quiz";

export function getQuestionLabel(question: QuizQuestion): string {
  if (question.type === "GRAMMAR_MEANING") return "문법의 의미는?";
  if (question.type === "GRAMMAR_SELECT") return "어떤 문법 표현인가?";
  if (question.type === "EXAMPLE_BLANK") return "JLPT 빈칸 문제";
  if (question.type === "SENTENCE_ORDER") return "JLPT 문장 배열";
  return "문제를 풀어보세요";
}

export function getPromptClass(question: QuizQuestion): string {
  if (
    question.type === "GRAMMAR_SELECT" ||
    question.type === "EXAMPLE_BLANK" ||
    question.type === "SENTENCE_ORDER"
  ) {
    return "quiz-question text-prompt";
  }

  return "quiz-question";
}
