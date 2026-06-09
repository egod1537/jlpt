import type { FillBlankSentenceContext, GrammarExample, GrammarItem } from "../types/grammar";
import type { QuizChoice, QuizMode, QuizQuestion, QuizType, SentenceOrderQuestionData } from "../types/quiz";
import { fillBlankQuestions, type FillBlankQuestion } from "../data/quiz/fillBlankQuestions";
import { sentenceOrderQuestions, type SentenceOrderQuestion } from "../data/quiz/sentenceOrderQuestions";
import { generateFillBlankChoices, generateGrammarChoices } from "./choiceGenerator";
import { shuffle, shuffleWithSeed } from "./shuffle";

export const QUESTIONS_PER_GRAMMAR = 20;

export const quizModes: Array<{ id: QuizMode; label: string }> = [
  { id: "meaning", label: "뜻 맞추기" },
  { id: "grammar", label: "문법 맞추기" },
  { id: "example", label: "빈칸 문제" },
  { id: "sentenceOrder", label: "문장 배열" },
];

function modeToQuizType(mode: QuizMode): QuizType {
  if (mode === "meaning") return "GRAMMAR_MEANING";
  if (mode === "grammar") return "GRAMMAR_SELECT";
  if (mode === "example") return "EXAMPLE_BLANK";
  return "SENTENCE_ORDER";
}

interface ExampleTargetMatch {
  example: GrammarExample;
  target: string;
  targetIndex: number;
}

const TARGET_FORM_OVERRIDES: Readonly<Record<string, readonly string[]>> = {
  "n2-011": ["かいもなく", "がいがある"],
  "n2-020": ["と思ったら", "かと思うと"],
  "n2-032": ["きった", "きれる", "きれない", "きる"],
  "n2-044": ["際は", "際に"],
  "n2-050": ["末に", "末の"],
  "n2-075": ["ではありませんか", "ではないか"],
  "n2-076": ["じゃありませんか", "ではないか"],
  "n2-077": ["でほしいものだ", "てほしいものだ"],
  "n2-088": ["どころではなかった", "どころではない", "ところではない"],
  "n2-132": ["抜きで", "ぬきで"],
  "n2-133": ["ぬいた", "ぬく"],
  "n2-166": ["もうとしていた", "ようとしている"],
  "n2-178": ["んじゃありません", "んじゃない"],
  "n2-179": ["んです", "んだ"],
};

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

  if (/[가-힣]/.test(optional)) {
    return expandOptionalParentheses(`${before}${after}`);
  }

  return [
    ...expandOptionalParentheses(`${before}${optional}${after}`),
    ...expandOptionalParentheses(`${before}${after}`),
  ];
}

function getExpressionVariants(item: GrammarItem): string[] {
  const rawCandidates = [
    ...(TARGET_FORM_OVERRIDES[item.id] ?? []),
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

function findExampleTargetMatches(item: GrammarItem): ExampleTargetMatch[] {
  const variants = getExpressionVariants(item);
  const matches: ExampleTargetMatch[] = [];

  item.examples.forEach((example) => {
    const exampleMatches: ExampleTargetMatch[] = [];

    variants.forEach((target) => {
      let searchIndex = 0;

      while (searchIndex < example.japanese.length) {
        const targetIndex = example.japanese.indexOf(target, searchIndex);

        if (targetIndex < 0) {
          break;
        }

        exampleMatches.push({ example, target, targetIndex });
        searchIndex = targetIndex + Math.max(1, target.length);
      }
    });

    exampleMatches
      .sort((left, right) => right.target.length - left.target.length || left.targetIndex - right.targetIndex)
      .forEach((match) => {
        const overlapsLongerMatch = matches.some(
          (existing) =>
            existing.example.id === match.example.id &&
            existing.targetIndex <= match.targetIndex &&
            existing.targetIndex + existing.target.length >= match.targetIndex + match.target.length,
        );

        if (!overlapsLongerMatch) {
          matches.push(match);
        }
      });
  });

  return matches;
}

function findExampleWithExpression(item: GrammarItem): ExampleTargetMatch {
  const match = findExampleTargetMatches(item)[0];

  if (match !== undefined) {
    return match;
  }

  const variants = getExpressionVariants(item);
  const fallbackExample = item.examples[0] ?? {
    id: `${item.id}-fallback-example`,
    japanese: item.expression,
    korean: item.meaningKo,
  };
  const fallbackTarget = variants[0] ?? item.expression;

  return {
    example: fallbackExample,
    target: fallbackTarget,
    targetIndex: fallbackExample.japanese.indexOf(fallbackTarget),
  };
}

function blankTarget(match: ExampleTargetMatch): string {
  if (match.targetIndex < 0) {
    return `${match.example.japanese}　（　　　）`;
  }

  return `${match.example.japanese.slice(0, match.targetIndex)}（　　　）${match.example.japanese.slice(
    match.targetIndex + match.target.length,
  )}`;
}

function buildDefaultFillBlankContext(item: GrammarItem): FillBlankSentenceContext {
  const connection = item.connection;
  const requiredConnectionType = /Vた/.test(connection)
    ? "V_PAST"
    : /V辞書形/.test(connection)
      ? "V_DICTIONARY"
      : /Vます形語幹/.test(connection)
        ? "V_MASU_STEM"
        : /Vない形語幹/.test(connection)
          ? "V_NAI_STEM"
          : /普通形/.test(connection)
            ? "PLAIN_FORM"
            : /N\+|Nの|Nである/.test(connection)
              ? "NOUN"
              : "ANY";

  return {
    requiredConnectionType,
    semanticTags: item.tags,
    expectsNegativeConclusion: /否定|制限|とは限らない|わけではない|부정|제한/.test(
      item.tags.join(" ") + item.nuanceKo + (item.warningKo ?? ""),
    ),
    expectsDutyOrResponsibility: /責任|義務|べき|당연|책임|의무/.test(item.tags.join(" ") + item.nuanceKo),
    expectsBadResult: /悪い結果|부정적|나쁜|望ましくない/.test(item.tags.join(" ") + item.nuanceKo),
  };
}

function buildConfusingNotes(questionGrammarIds: readonly string[], grammarById: ReadonlyMap<string, GrammarItem>): string[] {
  return questionGrammarIds
    .map((id) => grammarById.get(id))
    .filter((item): item is GrammarItem => item !== undefined)
    .map((item) => `${item.expression}: ${item.warningKo ?? item.nuanceKo}`);
}

function splitSentenceBlanks(sentenceWithBlanks: string): { prefix: string; suffix: string } {
  const firstBlankIndex = sentenceWithBlanks.indexOf("____");
  const lastBlankIndex = sentenceWithBlanks.lastIndexOf("____");

  if (firstBlankIndex < 0 || lastBlankIndex < 0) {
    return {
      prefix: sentenceWithBlanks,
      suffix: "",
    };
  }

  return {
    prefix: sentenceWithBlanks.slice(0, firstBlankIndex).trimEnd(),
    suffix: sentenceWithBlanks.slice(lastBlankIndex + "____".length).trimStart(),
  };
}

function buildFillBlankExplanation(params: {
  explanation: string;
}): string {
  return params.explanation;
}

export function buildManualFillBlankQuestion(
  question: FillBlankQuestion,
  allGrammar: readonly GrammarItem[],
): QuizQuestion {
  const grammarById = new Map(allGrammar.map((item) => [item.id, item]));
  const answerChoice = question.choices.find((choice) => choice.id === question.answerChoiceId);
  const correctGrammar = answerChoice === undefined ? undefined : grammarById.get(answerChoice.grammarId);
  const choices: QuizChoice[] = question.choices.map((choice) => ({
    id: choice.id,
    text: choice.text,
    sourceGrammarId: choice.grammarId,
    baseExpression: choice.baseExpression,
    conjugatedExpression: choice.conjugatedExpression,
    isSimilarDistractor: choice.isSimilarDistractor,
  }));
  const confusingNotes = buildConfusingNotes(
    question.sourceGrammarIds.filter((id) => id !== correctGrammar?.id),
    grammarById,
  );

  return {
    id: question.id,
    type: "EXAMPLE_BLANK",
    level: question.level,
    prompt: question.sentenceWithBlank,
    subPrompt: "次の文の（　　　）に入る最もよいものを、1・2・3・4から一つ選びなさい。",
    choices,
    answerChoiceId: question.answerChoiceId,
    explanation: buildFillBlankExplanation({
      explanation: question.explanation,
    }),
    fillBlank: {
      sentence: question.sentence,
      sentenceWithBlank: question.sentenceWithBlank,
      korean: question.korean,
      sourceGrammarIds: question.sourceGrammarIds,
      answerBaseExpression: answerChoice?.baseExpression ?? correctGrammar?.expression,
      answerMeaningKo: correctGrammar?.meaningKo,
      answerConnection: correctGrammar?.connection,
      confusingNotes,
    },
    sourceGrammarId: correctGrammar?.id ?? answerChoice?.grammarId,
    sourceGrammarIds: question.sourceGrammarIds,
    tags: question.tags,
  };
}

export function buildManualSentenceOrderQuestion(question: SentenceOrderQuestion): QuizQuestion {
  const sortedPieces = [...question.pieces].sort((left, right) => left.order - right.order);
  const correctPieceIds = question.correctPieceIds.length > 0 ? question.correctPieceIds : sortedPieces.map((piece) => piece.id);
  const { prefix, suffix } = splitSentenceBlanks(question.sentenceWithBlanks);
  const choices = shuffleWithSeed(
    question.pieces.map((piece) => ({
      id: piece.id,
      text: piece.text,
      sourceGrammarId: question.sourceGrammarIds[0],
    })),
    `${question.id}:sentence-pieces`,
  );

  return {
    id: question.id,
    type: "SENTENCE_ORDER",
    level: question.level,
    prompt: "次の文が正しい文になるように、1・2・3・4を並べ替えなさい。",
    subPrompt: question.sentenceWithBlanks,
    choices,
    answerChoiceId: correctPieceIds.join(">"),
    answerChoiceIds: correctPieceIds,
    explanation: question.explanation,
    sentenceOrder: {
      prefix,
      suffix,
      fullSentence: question.sentence,
      sentenceWithBlanks: question.sentenceWithBlanks,
      translationKo: question.korean,
      correctChoiceIds: correctPieceIds,
    },
    sourceGrammarId: question.sourceGrammarIds[0],
    sourceGrammarIds: question.sourceGrammarIds,
    tags: question.tags,
  };
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
    .split(/(?<=、)|(?<=て)|(?<=で)|(?<=に)|(?<=を)|(?<=は)|(?<=が)|(?<=も)|(?<=べきだ)|(?<=だ)|(?<=です)/)
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
      sentenceWithBlanks: `${prefix}${prefix ? " " : ""}${safePieces.map(() => "____").join(" ")}${suffix ? ` ${suffix}` : ""}`,
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
  const exampleMatch = findExampleWithExpression(correct);
  const { example } = exampleMatch;
  const expression = exampleMatch.target;

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
    const sentenceContext = buildDefaultFillBlankContext(correct);
    const fillBlankChoices = generateFillBlankChoices({
      correctGrammar: correct,
      sentenceContext,
      allGrammar,
      count: 4,
      sourceGrammarIds: correct.similarGrammarIds,
      seed: questionId,
    });
    const answerChoiceId = fillBlankChoices.find((choice) => choice.grammarId === correct.id && !choice.isSimilarDistractor)?.id;
    const sentenceWithBlank = blankTarget(exampleMatch);

    return {
      id: questionId,
      type: modeToQuizType(mode),
      level: correct.level,
      prompt: sentenceWithBlank,
      subPrompt: "次の文の（　　　）に入る最もよいものを、1・2・3・4から一つ選びなさい。",
      choices: fillBlankChoices.map((choice) => ({
        id: choice.id,
        text: choice.text,
        sourceGrammarId: choice.grammarId,
        baseExpression: choice.baseExpression,
        conjugatedExpression: choice.conjugatedExpression,
        isSimilarDistractor: choice.isSimilarDistractor,
      })),
      answerChoiceId: answerChoiceId ?? `${questionId}-answer`,
      explanation: buildFillBlankExplanation({
        explanation: `${correct.nuanceKo} ${example.korean}`,
      }),
      fillBlank: {
        sentence: example.japanese,
        sentenceWithBlank,
        korean: example.korean,
        sourceGrammarIds: [correct.id, ...correct.similarGrammarIds],
        answerBaseExpression: correct.expression,
        answerMeaningKo: correct.meaningKo,
        answerConnection: correct.connection,
        confusingNotes: buildConfusingNotes(correct.similarGrammarIds, new Map(allGrammar.map((item) => [item.id, item]))),
      },
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

  throw new Error(`Unsupported quiz mode: ${mode}`);
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

export function getManualFillBlankQuestions(allGrammar: readonly GrammarItem[]): QuizQuestion[] {
  return fillBlankQuestions.map((question) => buildManualFillBlankQuestion(question, allGrammar));
}

export function getManualSentenceOrderQuestions(): QuizQuestion[] {
  return sentenceOrderQuestions.map(buildManualSentenceOrderQuestion);
}
