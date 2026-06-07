import type { GrammarExample, GrammarItem } from "../types/grammar";
import type { QuizChoice, QuizMode, QuizQuestion, QuizType, SentenceOrderQuestionData } from "../types/quiz";
import { generateGrammarChoices } from "./choiceGenerator";
import { shuffle, shuffleWithSeed } from "./shuffle";

export const quizModes: Array<{ id: QuizMode; label: string }> = [
  { id: "meaning", label: "뜻 맞추기" },
  { id: "grammar", label: "문법 맞추기" },
  { id: "example", label: "빈칸 문제" },
  { id: "sentenceOrder", label: "문장 배열" },
  { id: "nuance", label: "뉘앙스 구분" },
];

function modeToQuizType(mode: QuizMode): QuizType {
  if (mode === "meaning") return "GRAMMAR_MEANING";
  if (mode === "grammar") return "GRAMMAR_SELECT";
  if (mode === "example") return "EXAMPLE_BLANK";
  if (mode === "sentenceOrder") return "SENTENCE_ORDER";
  return "NUANCE_SELECT";
}

function buildChoices(items: readonly GrammarItem[], textSelector: (item: GrammarItem) => string): QuizChoice[] {
  return items.map((item) => ({
    id: item.id,
    text: textSelector(item),
    sourceGrammarId: item.id,
  }));
}

function expandOptionalParentheses(value: string): string[] {
  const match = value.match(/（([^）]+)）/);

  if (match === null || match.index === undefined) {
    return [value];
  }

  const before = value.slice(0, match.index);
  const optional = match[1] ?? "";
  const after = value.slice(match.index + match[0].length);

  return [
    ...expandOptionalParentheses(`${before}${optional}${after}`),
    ...expandOptionalParentheses(`${before}${after}`),
  ];
}

function getExpressionVariants(item: GrammarItem): string[] {
  const rawCandidates = [
    item.expression,
    item.expression.replace(/（[^）]+）/g, ""),
    ...item.expression.split(/[\/／]/),
    ...item.expression.split(/[~～]/),
  ];
  const expanded = rawCandidates.flatMap(expandOptionalParentheses);
  const baseVariants = expanded
    .flatMap((candidate) => candidate.split(/[\/／]/))
    .map((candidate) => candidate.replace(/~|～/g, "").trim())
    .filter((candidate) => candidate.length > 0 && !/[가-힣]/.test(candidate));
  const conjugationVariants = baseVariants.flatMap((candidate) => {
    const variants = [candidate];

    if (candidate.endsWith("る") || candidate.endsWith("だ")) {
      variants.push(candidate.slice(0, -1));
    }

    if (candidate.endsWith("ない")) {
      variants.push(candidate.slice(0, -2));
    }

    if (candidate.endsWith("に")) {
      variants.push(candidate.slice(0, -1));
    }

    return variants;
  });
  const variants = conjugationVariants.filter((candidate) => candidate.length > 1);

  return [...new Set(variants)].sort((a, b) => b.length - a.length);
}

function findExampleWithExpression(item: GrammarItem): { example: GrammarExample; expression: string } {
  const variants = getExpressionVariants(item);

  for (const example of item.examples) {
    const expression = variants.find((variant) => example.japanese.includes(variant));

    if (expression !== undefined) {
      return { example, expression };
    }
  }

  return {
    example: item.examples[0] ?? {
      id: `${item.id}-fallback-example`,
      japanese: item.expression,
      korean: item.meaningKo,
    },
    expression: variants[0] ?? item.expression,
  };
}

function blankExpression(sentence: string, expression: string): string {
  if (sentence.includes(expression)) {
    return sentence.replace(expression, "（　　　）");
  }

  return `${sentence}　（　　　）`;
}

function normalizeSentencePart(value: string): string {
  return value.replace(/^[、。！？\s]+/, "").replace(/[。！？\s]+$/, "");
}

function splitJapaneseChunks(value: string, maxChunks: number): string[] {
  const normalized = normalizeSentencePart(value);

  if (!normalized) {
    return [];
  }

  const chunks = normalized
    .split(/(?<=、)|(?<=て)|(?<=で)|(?<=に)|(?<=を)|(?<=は)|(?<=が)|(?<=と)|(?<=も)|(?<=べきだ)|(?<=だ)|(?<=です)/)
    .map((chunk) => chunk.replace(/、/g, "").trim())
    .filter(Boolean);

  if (chunks.length >= maxChunks) {
    return chunks.slice(0, maxChunks - 1).concat(chunks.slice(maxChunks - 1).join(""));
  }

  if (normalized.length <= maxChunks) {
    return normalized.split("");
  }

  const fallbackChunks: string[] = [];
  const baseLength = Math.ceil(normalized.length / maxChunks);

  for (let index = 0; index < normalized.length && fallbackChunks.length < maxChunks; index += baseLength) {
    fallbackChunks.push(normalized.slice(index, index + baseLength));
  }

  return fallbackChunks;
}

function getSentenceOrderParts(
  example: GrammarExample,
  expression: string,
): { prefix: string; suffix: string; pieces: string[] } {
  const expressionIndex = example.japanese.indexOf(expression);

  if (expressionIndex < 0) {
    const chunks = splitJapaneseChunks(example.japanese, 4);
    return {
      prefix: "",
      suffix: "",
      pieces: chunks.length === 4 ? chunks : [expression, ...chunks].slice(0, 4),
    };
  }

  const prefix = example.japanese.slice(0, expressionIndex);
  const rawSuffix = example.japanese.slice(expressionIndex + expression.length);
  const suffixChunks = splitJapaneseChunks(rawSuffix, 3);
  const prefixChunks = splitJapaneseChunks(prefix, 3);
  const pieces =
    suffixChunks.length >= 3
      ? [expression, ...suffixChunks.slice(0, 3)]
      : [...prefixChunks.slice(-1), expression, ...suffixChunks].slice(0, 4);

  if (pieces.length >= 4) {
    return {
      prefix: suffixChunks.length >= 3 ? prefix : "",
      suffix: suffixChunks.length >= 3 ? "" : rawSuffix,
      pieces: pieces.slice(0, 4),
    };
  }

  const fallbackChunks = splitJapaneseChunks(example.japanese, 4);

  return {
    prefix: "",
    suffix: "",
    pieces: fallbackChunks.length >= 4 ? fallbackChunks.slice(0, 4) : [expression, ...fallbackChunks].slice(0, 4),
  };
}

function buildSentenceOrderData(
  questionId: string,
  item: GrammarItem,
  example: GrammarExample,
  expression: string,
): { choices: QuizChoice[]; data: SentenceOrderQuestionData } {
  const { prefix, suffix, pieces } = getSentenceOrderParts(example, expression);
  const safePieces = pieces.length >= 4 ? pieces.slice(0, 4) : [expression, "こと", "を", "確認する"].slice(0, 4);
  const correctChoices = safePieces.map((piece, index) => ({
    id: `${questionId}-part-${index + 1}`,
    text: piece,
    sourceGrammarId: item.id,
  }));
  const choices = shuffleWithSeed(correctChoices, `${questionId}:sentence-pieces`);

  return {
    choices,
    data: {
      prefix,
      suffix,
      fullSentence: example.japanese,
      translationKo: example.korean,
      correctChoiceIds: correctChoices.map((choice) => choice.id),
    },
  };
}

export function generateQuizQuestion(
  mode: QuizMode,
  correct: GrammarItem,
  allGrammar: readonly GrammarItem[],
): QuizQuestion {
  const questionId = `${mode}-${correct.id}`;
  const choiceItems = generateGrammarChoices(correct, allGrammar, 4, questionId);
  const { example, expression } = findExampleWithExpression(correct);

  if (mode === "meaning") {
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
    return {
      id: questionId,
      type: modeToQuizType(mode),
      level: correct.level,
      prompt: blankExpression(example.japanese, expression),
      subPrompt: "次の文の（　　　）に入る最もよいものを、1・2・3・4から一つ選びなさい。",
      choices: buildChoices(choiceItems, (item) => item.expression),
      answerChoiceId: correct.id,
      explanation: `${correct.nuanceKo} ${example.korean}`,
      sourceGrammarId: correct.id,
      sourceExampleId: example.id,
      tags: correct.tags,
    };
  }

  if (mode === "sentenceOrder") {
    const { choices, data } = buildSentenceOrderData(questionId, correct, example, expression);
    const correctAnswer = data.correctChoiceIds.join(">");

    return {
      id: questionId,
      type: modeToQuizType(mode),
      level: correct.level,
      prompt: "次の文が正しい文になるように、1・2・3・4を並べ替えなさい。",
      subPrompt: correct.meaningKo,
      choices,
      answerChoiceId: correctAnswer,
      answerChoiceIds: data.correctChoiceIds,
      explanation: correct.nuanceKo,
      sentenceOrder: data,
      sourceGrammarId: correct.id,
      sourceExampleId: example.id,
      tags: correct.tags,
    };
  }

  const nuanceChoiceItems = shuffle(choiceItems);

  return {
    id: questionId,
    type: modeToQuizType(mode),
    level: correct.level,
    prompt: correct.expression,
    subPrompt: correct.meaningKo,
    choices: buildChoices(nuanceChoiceItems, (item) => item.nuanceKo),
    answerChoiceId: correct.id,
    explanation: correct.nuanceKo,
    sourceGrammarId: correct.id,
    tags: correct.tags,
  };
}

export function generateQuizSet(
  mode: QuizMode,
  grammarItems: readonly GrammarItem[],
  count = 20,
): QuizQuestion[] {
  return shuffle(grammarItems)
    .slice(0, count)
    .map((item) => generateQuizQuestion(mode, item, grammarItems));
}
