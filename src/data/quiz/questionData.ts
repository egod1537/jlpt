import type { FillBlankSentenceContext, JlptLevel } from "../../types/grammar";

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

export interface GrammarQuestionSet {
  grammarId: string;
  fillBlankQuestions: FillBlankQuestion[];
  sentenceOrderQuestions: SentenceOrderQuestion[];
}
