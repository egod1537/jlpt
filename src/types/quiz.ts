import type { JlptLevel } from "./grammar";

export type QuizType =
  | "GRAMMAR_MEANING"
  | "GRAMMAR_SELECT"
  | "EXAMPLE_BLANK"
  | "FILL_BLANK"
  | "SENTENCE_ORDER"
  | "CONNECTION_SELECT"
  | "VOCABULARY_MEANING"
  | "VOCABULARY_READING";

export type QuizMode = "meaning" | "grammar" | "example" | "sentenceOrder" | "connection";

export type QuizPhase = "NORMAL" | "REVIEW" | "SET_COMPLETE";

export interface QuizChoice {
  id: string;
  text: string;
  sourceGrammarId?: string;
  baseExpression?: string;
  conjugatedExpression?: string;
  isSimilarDistractor?: boolean;
}

export interface FillBlankQuestionDetails {
  sentence: string;
  sentenceWithBlank: string;
  korean: string;
  sourceGrammarIds: string[];
  answerBaseExpression?: string;
  answerMeaningKo?: string;
  answerConnection?: string;
  confusingNotes?: string[];
}

export interface SentenceOrderQuestionData {
  prefix: string;
  suffix: string;
  fullSentence: string;
  sentenceWithBlanks: string;
  translationKo: string;
  correctChoiceIds: string[];
}

export interface QuizQuestion {
  id: string;
  type: QuizType;
  level: JlptLevel;
  prompt: string;
  subPrompt?: string;
  choices: QuizChoice[];
  answerChoiceId: string;
  answerChoiceIds?: string[];
  explanation: string;
  sentenceOrder?: SentenceOrderQuestionData;
  fillBlank?: FillBlankQuestionDetails;
  sourceGrammarId?: string;
  sourceGrammarIds?: string[];
  sourceVocabularyId?: string;
  sourceExampleId?: string;
  tags: string[];
}

export interface WrongAnswerRecord {
  questionId: string;
  selectedChoiceId?: string;
  selectedChoiceIds?: string[];
  selectedPieceIds?: string[];
  inputAnswer?: string;
  correctAnswer: string;
  answeredAt: string;
  attemptCount: number;
}

export interface QuizSessionState {
  currentSetIndex: number;
  currentSetSize: number;
  phase: QuizPhase;
  currentQuestionIndex: number;
  currentQuestions: QuizQuestion[];
  wrongQueue: WrongAnswerRecord[];
  correctCount: number;
  wrongCount: number;
  reviewedCorrectCount: number;
  reviewedWrongCount: number;
  canProceedToNextSet: boolean;
}

export interface PersistedQuizSession {
  currentSetIndex: number;
  currentSetSize?: number;
  phase: QuizPhase;
  currentQuestionIndex: number;
  currentQuestionIds: string[];
  wrongQueue: WrongAnswerRecord[];
  correctCount: number;
  wrongCount: number;
  reviewedCorrectCount: number;
  reviewedWrongCount: number;
}

export interface UserAnswer {
  selectedChoiceId?: string;
  selectedChoiceIds?: string[];
  selectedPieceIds?: string[];
  inputAnswer?: string;
}

export interface AnswerResult {
  isCorrect: boolean;
  selectedChoiceId?: string;
  selectedChoiceIds?: string[];
  selectedPieceIds?: string[];
  inputAnswer?: string;
  correctAnswer: string;
  explanation: string;
}
