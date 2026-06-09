import { grammarQuestionSets } from "./grammarQuestionSets";

export type { SentenceOrderPiece, SentenceOrderQuestion } from "./questionData";

export const sentenceOrderQuestions = grammarQuestionSets.flatMap(
  (questionSet) => questionSet.sentenceOrderQuestions,
);
