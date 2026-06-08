import type { FillBlankSentenceContext, JlptLevel } from "../../types/grammar";
import fillBlankQuestionData from "./fillBlankQuestions.json";

export interface FillBlankChoice {
  id: string;
  text: string;
  grammarId: string;
  baseExpression: string;
  conjugatedExpression: string;
  isSimilarDistractor: boolean;
}

export interface FillBlankQuestion {
  id: string;
  level: JlptLevel;
  sentence: string;
  sentenceWithBlank: string;
  korean: string;
  answerChoiceId: string;
  choices: FillBlankChoice[];
  explanation: string;
  sourceGrammarIds: string[];
  tags: string[];
  sentenceContext?: FillBlankSentenceContext;
}

export const fillBlankQuestions = fillBlankQuestionData as FillBlankQuestion[];
