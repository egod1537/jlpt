import type { GrammarItem } from "../../types/grammar";
import type {
  QuizChoice,
  QuizMode,
  QuizQuestion,
  QuizType,
} from "../../types/quiz";
import { generateGrammarChoices } from "../choiceGenerator";
import { buildGeneratedFillBlankQuestion } from "./fillBlankQuestionFactory";
import {
  findExampleWithExpression,
  getRecallExpression,
  getRecallHint,
} from "./grammarExampleMatcher";
import { buildGeneratedSentenceOrderQuestion } from "./sentenceOrderQuestionFactory";

export const quizModes: Array<{ id: QuizMode; label: string }> = [
  { id: "meaning", label: "뜻 맞추기" },
  { id: "grammar", label: "문법 맞추기" },
  { id: "example", label: "빈칸 문제" },
  { id: "sentenceOrder", label: "문장 배열" },
  { id: "recall", label: "문법 암기" },
];

function modeToQuizType(mode: QuizMode): QuizType {
  if (mode === "meaning") return "GRAMMAR_MEANING";
  if (mode === "grammar") return "GRAMMAR_SELECT";
  if (mode === "example") return "EXAMPLE_BLANK";
  if (mode === "recall") return "GRAMMAR_RECALL";
  return "SENTENCE_ORDER";
}

function buildChoices(
  items: readonly GrammarItem[],
  textSelector: (item: GrammarItem) => string,
): QuizChoice[] {
  return items.map((item) => ({
    id: item.id,
    text: textSelector(item),
    sourceGrammarId: item.id,
  }));
}

const MEANING_KEY_STOP_WORDS = new Set([
  "가",
  "과",
  "는",
  "도",
  "로",
  "를",
  "에",
  "와",
  "은",
  "을",
  "의",
  "이",
]);

function normalizeMeaningChoiceKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\([^)]*\)/g, "")
    .replace(/[~～]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

function getMeaningChoiceKeys(item: GrammarItem): string[] {
  const visibleMeaning = item.meaningKo
    .normalize("NFKC")
    .replace(/\([^)]*\)/g, "");
  const fullKey = normalizeMeaningChoiceKey(visibleMeaning);
  const partKeys = visibleMeaning
    .split(/[,\u3001/]+/)
    .map(normalizeMeaningChoiceKey)
    .filter((key) => key.length > 0 && !MEANING_KEY_STOP_WORDS.has(key));

  return [...new Set([fullKey, ...partKeys].filter(Boolean))];
}

function buildRecallQuestion(
  correct: GrammarItem,
  questionId: string,
): QuizQuestion {
  const studyChoiceId = `${questionId}-study`;
  const knownChoiceId = `${questionId}-known`;

  return {
    id: questionId,
    type: "GRAMMAR_RECALL",
    level: correct.level,
    prompt: getRecallExpression(correct.expression),
    subPrompt: correct.meaningKo,
    hint: getRecallHint(correct.expression),
    choices: [
      { id: studyChoiceId, text: "공부하겠음" },
      { id: knownChoiceId, text: "알고있음" },
    ],
    answerChoiceId: knownChoiceId,
    explanation: correct.nuanceKo,
    sourceGrammarId: correct.id,
    tags: correct.tags,
  };
}

export function generateQuizQuestion(
  mode: QuizMode,
  correct: GrammarItem,
  allGrammar: readonly GrammarItem[],
): QuizQuestion {
  const questionId = `${mode}-${correct.id}`;

  if (mode === "recall") {
    return buildRecallQuestion(correct, questionId);
  }

  const exampleMatch = findExampleWithExpression(correct);

  if (mode === "meaning") {
    const choiceItems = generateGrammarChoices(
      correct,
      allGrammar,
      4,
      questionId,
      getMeaningChoiceKeys,
    );

    return {
      id: questionId,
      type: modeToQuizType(mode),
      level: correct.level,
      prompt: correct.expression,
      subPrompt: correct.connection,
      choices: buildChoices(choiceItems, (item) => item.meaningKo),
      answerChoiceId: correct.id,
      explanation: correct.nuanceKo,
      sourceGrammarId: correct.id,
      tags: correct.tags,
    };
  }

  if (mode === "grammar") {
    const choiceItems = generateGrammarChoices(
      correct,
      allGrammar,
      4,
      questionId,
    );

    return {
      id: questionId,
      type: modeToQuizType(mode),
      level: correct.level,
      prompt: correct.meaningKo,
      subPrompt: correct.nuanceKo,
      choices: buildChoices(choiceItems, (item) => item.expression),
      answerChoiceId: correct.id,
      explanation: correct.nuanceKo,
      sourceGrammarId: correct.id,
      tags: correct.tags,
    };
  }

  if (mode === "example") {
    return buildGeneratedFillBlankQuestion(
      correct,
      allGrammar,
      exampleMatch,
      questionId,
    );
  }

  if (mode === "sentenceOrder") {
    return buildGeneratedSentenceOrderQuestion(
      correct,
      exampleMatch.example,
      exampleMatch.target,
      questionId,
    );
  }

  throw new Error(`Unsupported quiz mode: ${mode}`);
}
