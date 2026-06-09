import { grammarQuestionSets } from "./grammarQuestionSets";

export type { FillBlankChoice, FillBlankQuestion } from "./questionData";

export const fillBlankQuestions = grammarQuestionSets.flatMap(
  (questionSet) => questionSet.fillBlankQuestions,
);
