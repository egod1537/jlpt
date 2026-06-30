import type { SentenceOrderQuestion } from "../../data/quiz/sentenceOrderQuestions";
import type { GrammarExample, GrammarItem } from "../../types/grammar";
import type {
  QuizChoice,
  QuizQuestion,
  SentenceOrderQuestionData,
} from "../../types/quiz";
import { shuffleWithSeed } from "../shuffle";

function splitSentenceBlanks(
  sentenceWithBlanks: string,
): { prefix: string; suffix: string } {
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
    suffix: sentenceWithBlanks
      .slice(lastBlankIndex + "____".length)
      .trimStart(),
  };
}

export function buildManualSentenceOrderQuestion(
  question: SentenceOrderQuestion,
): QuizQuestion {
  const sortedPieces = [...question.pieces].sort(
    (left, right) => left.order - right.order,
  );
  const correctPieceIds =
    question.correctPieceIds.length > 0
      ? question.correctPieceIds
      : sortedPieces.map((piece) => piece.id);
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
    prompt:
      "次の文が正しい文になるように、1・2・3・4を並べ替えなさい。",
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
    .split(
      /(?<=、)|(?<=て)|(?<=で)|(?<=に)|(?<=を)|(?<=は)|(?<=が)|(?<=も)|(?<=べきだ)|(?<=だ)|(?<=です)/,
    )
    .map((chunk) => chunk.replace(/、/g, "").trim())
    .filter(Boolean);

  if (chunks.length >= maxChunks) {
    return chunks
      .slice(0, maxChunks - 1)
      .concat(chunks.slice(maxChunks - 1).join(""));
  }

  if (normalized.length <= maxChunks) {
    return normalized.split("");
  }

  const fallbackChunks: string[] = [];
  const baseLength = Math.ceil(normalized.length / maxChunks);

  for (
    let index = 0;
    index < normalized.length && fallbackChunks.length < maxChunks;
    index += baseLength
  ) {
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
    pieces:
      fallbackChunks.length >= 4
        ? fallbackChunks.slice(0, 4)
        : [expression, ...fallbackChunks].slice(0, 4),
  };
}

function buildSentenceOrderData(
  questionId: string,
  item: GrammarItem,
  example: GrammarExample,
  expression: string,
): { choices: QuizChoice[]; data: SentenceOrderQuestionData } {
  const { prefix, suffix, pieces } = getSentenceOrderParts(example, expression);
  const safePieces =
    pieces.length >= 4
      ? pieces.slice(0, 4)
      : [expression, "こと", "を", "確認する"].slice(0, 4);
  const correctChoices = safePieces.map((piece, index) => ({
    id: `${questionId}-part-${index + 1}`,
    text: piece,
    sourceGrammarId: item.id,
  }));

  return {
    choices: shuffleWithSeed(
      correctChoices,
      `${questionId}:sentence-pieces`,
    ),
    data: {
      prefix,
      suffix,
      fullSentence: example.japanese,
      sentenceWithBlanks: `${prefix}${prefix ? " " : ""}${safePieces
        .map(() => "____")
        .join(" ")}${suffix ? ` ${suffix}` : ""}`,
      translationKo: example.korean,
      correctChoiceIds: correctChoices.map((choice) => choice.id),
    },
  };
}

export function buildGeneratedSentenceOrderQuestion(
  correct: GrammarItem,
  example: GrammarExample,
  expression: string,
  questionId: string,
): QuizQuestion {
  const { choices, data } = buildSentenceOrderData(
    questionId,
    correct,
    example,
    expression,
  );

  return {
    id: questionId,
    type: "SENTENCE_ORDER",
    level: correct.level,
    prompt:
      "次の文が正しい文になるように、1・2・3・4を並べ替えなさい。",
    subPrompt: correct.meaningKo,
    choices,
    answerChoiceId: data.correctChoiceIds.join(">"),
    answerChoiceIds: data.correctChoiceIds,
    explanation: correct.nuanceKo,
    sentenceOrder: data,
    sourceGrammarId: correct.id,
    sourceExampleId: example.id,
    tags: correct.tags,
  };
}
