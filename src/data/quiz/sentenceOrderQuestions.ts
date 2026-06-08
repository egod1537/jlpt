import type { JlptLevel } from "../../types/grammar";
import sentenceOrderQuestionData from "./sentenceOrderQuestions.json";

export interface SentenceOrderPiece {
  id: string;
  text: string;
  order: number;
}

export interface SentenceOrderQuestion {
  id: string;
  level: JlptLevel;
  sentence: string;
  sentenceWithBlanks: string;
  korean: string;
  pieces: SentenceOrderPiece[];
  correctPieceIds: string[];
  explanation: string;
  sourceGrammarIds: string[];
  tags: string[];
}

export const sentenceOrderQuestions = sentenceOrderQuestionData as SentenceOrderQuestion[];
