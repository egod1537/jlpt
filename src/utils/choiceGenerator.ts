import type { FillBlankSentenceContext, GrammarItem } from "../types/grammar";
import type { FillBlankChoice } from "../data/quiz/fillBlankQuestions";
import { shuffle, shuffleWithSeed } from "./shuffle";

function dedupeGrammar(items: readonly GrammarItem[]): GrammarItem[] {
  const seen = new Set<string>();
  const deduped: GrammarItem[] = [];

  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
  }

  return deduped;
}

export function generateGrammarChoices(
  correct: GrammarItem,
  allGrammar: readonly GrammarItem[],
  count = 4,
  seed?: string,
): GrammarItem[] {
  const randomize = <T>(items: readonly T[], salt: string): T[] =>
    seed === undefined ? shuffle(items) : shuffleWithSeed(items, `${seed}:${salt}`);
  const byId = new Map(allGrammar.map((item) => [item.id, item]));
  const similarById = correct.similarGrammarIds
    .map((id) => byId.get(id))
    .filter((item): item is GrammarItem => item !== undefined);
  const similarByName = correct.similarExpressionNames
    .flatMap((name) =>
      allGrammar.filter(
        (item) => item.id !== correct.id && (item.expression.includes(name) || name.includes(item.expression)),
      ),
    );
  const sameConnection = allGrammar.filter(
    (item) => item.id !== correct.id && item.connection === correct.connection,
  );
  const sameTags = allGrammar.filter(
    (item) => item.id !== correct.id && correct.tags.some((tag) => item.tags.includes(tag)),
  );
  const sameLevel = allGrammar.filter((item) => item.id !== correct.id && item.level === correct.level);
  const fallback = allGrammar.filter((item) => item.id !== correct.id);
  const candidates = dedupeGrammar([
    ...randomize(similarById, "similar-id"),
    ...randomize(similarByName, "similar-name"),
    ...randomize(sameConnection, "connection"),
    ...randomize(sameTags, "tags"),
    ...randomize(sameLevel, "level"),
    ...randomize(fallback, "fallback"),
  ]).slice(0, Math.max(0, count - 1));

  return randomize([correct, ...candidates], "final").slice(0, count);
}

function scoreBlankChoiceForm(item: GrammarItem, context: FillBlankSentenceContext, formText: string, formId: string): number {
  let score = 0;
  const label = formId.toLowerCase();

  if (context.requiredConnectionType === "ANY") score += 1;
  if (context.requiredConnectionType === "V_PAST" && (label.includes("past") || formText.startsWith("した"))) score += 8;
  if (context.requiredConnectionType === "V_DICTIONARY" && (label.includes("dictionary") || formText.startsWith("する"))) {
    score += 8;
  }
  if (context.requiredConnectionType === "PLAIN_FORM" && label.includes("plain")) score += 8;
  if (context.requiredConnectionType === "NOUN" && (label.includes("noun") || formText.includes("の"))) score += 8;

  for (const tag of context.semanticTags) {
    if (item.tags.includes(tag)) score += 2;
    if (item.nuanceKo.includes(tag) || item.meaningKo.includes(tag) || item.warningKo?.includes(tag)) score += 1;
  }

  if (context.expectsNegativeConclusion && /否定|制限|부정|제한/.test(item.tags.join(" ") + item.nuanceKo + (item.warningKo ?? ""))) {
    score += 4;
  }
  if (context.expectsDutyOrResponsibility && /責任|義務|책임|의무|당연/.test(item.tags.join(" ") + item.nuanceKo)) {
    score += 4;
  }
  if (context.expectsBadResult && /悪い結果|부정적|나쁜|望ましくない/.test(item.tags.join(" ") + item.nuanceKo)) {
    score += 4;
  }
  if (context.expectsContrast && /대조|반면|逆接|対照/.test(item.tags.join(" ") + item.nuanceKo)) {
    score += 4;
  }

  return score;
}

function cleanBaseExpression(expression: string): string {
  return expression
    .replace(/（([^）]+)）/g, "$1")
    .replace(/\([^)]*\)/g, "")
    .split(/[\/／~～]/)[0]
    .trim();
}

function inferBlankChoiceText(item: GrammarItem, context: FillBlankSentenceContext): string {
  const base = cleanBaseExpression(item.expression);
  const connection = item.connection;

  if (context.requiredConnectionType === "V_PAST" || /Vた/.test(connection)) {
    return base.startsWith("た") ? `し${base}` : `した${base}`;
  }

  if (context.requiredConnectionType === "V_DICTIONARY" || /V辞書形/.test(connection)) {
    return `する${base}`;
  }

  if (context.requiredConnectionType === "V_MASU_STEM" || /Vます形語幹/.test(connection)) {
    return `し${base}`;
  }

  if (context.requiredConnectionType === "V_NAI_STEM" || /Vない形語幹/.test(connection)) {
    return `せ${base}`;
  }

  return base;
}

function getBestBlankChoiceText(item: GrammarItem, context: FillBlankSentenceContext): string | null {
  const forms = item.blankChoiceForms ?? [];

  if (forms.length === 0) {
    return inferBlankChoiceText(item, context);
  }

  return [...forms]
    .sort(
      (left, right) =>
        scoreBlankChoiceForm(item, context, right.text, right.formId) -
        scoreBlankChoiceForm(item, context, left.text, left.formId),
    )[0]?.text ?? null;
}

function collectFillBlankCandidates(params: {
  correctGrammar: GrammarItem;
  sentenceContext: FillBlankSentenceContext;
  allGrammar: readonly GrammarItem[];
  sourceGrammarIds?: readonly string[];
  seed?: string;
}): GrammarItem[] {
  const { allGrammar, correctGrammar, seed, sentenceContext, sourceGrammarIds = [] } = params;
  const randomize = <T>(items: readonly T[], salt: string): T[] =>
    seed === undefined ? shuffle(items) : shuffleWithSeed(items, `${seed}:${salt}`);
  const byId = new Map(allGrammar.map((item) => [item.id, item]));
  const sourceGrammar = sourceGrammarIds
    .filter((id) => id !== correctGrammar.id)
    .map((id) => byId.get(id))
    .filter((item): item is GrammarItem => item !== undefined);
  const similarGrammar = correctGrammar.similarGrammarIds
    .map((id) => byId.get(id))
    .filter((item): item is GrammarItem => item !== undefined);
  const sameTags = allGrammar.filter(
    (item) => item.id !== correctGrammar.id && correctGrammar.tags.some((tag) => item.tags.includes(tag)),
  );
  const sameLevel = allGrammar.filter((item) => item.id !== correctGrammar.id && item.level === correctGrammar.level);
  const fallback = allGrammar.filter((item) => item.id !== correctGrammar.id);

  return dedupeGrammar([
    ...sourceGrammar,
    ...similarGrammar,
    ...randomize(sameTags, "tags"),
    ...randomize(sameLevel, "level"),
    ...randomize(fallback, "fallback"),
  ]).filter((item) => getBestBlankChoiceText(item, sentenceContext) !== null);
}

export function generateFillBlankChoices(params: {
  correctGrammar: GrammarItem;
  sentenceContext: FillBlankSentenceContext;
  allGrammar: readonly GrammarItem[];
  count: number;
  sourceGrammarIds?: readonly string[];
  seed?: string;
}): FillBlankChoice[] {
  const { allGrammar, correctGrammar, count, seed, sentenceContext, sourceGrammarIds } = params;
  const randomize = <T>(items: readonly T[], salt: string): T[] =>
    seed === undefined ? shuffle(items) : shuffleWithSeed(items, `${seed}:${salt}`);
  const correctText = getBestBlankChoiceText(correctGrammar, sentenceContext) ?? correctGrammar.expression;
  const correctChoice: FillBlankChoice = {
    id: `${seed ?? correctGrammar.id}-answer`,
    text: correctText,
    grammarId: correctGrammar.id,
    baseExpression: correctGrammar.expression,
    conjugatedExpression: correctText,
    isSimilarDistractor: false,
  };
  const candidates = collectFillBlankCandidates({
    correctGrammar,
    sentenceContext,
    allGrammar,
    sourceGrammarIds,
    seed,
  });
  const distractors = candidates.slice(0, Math.max(0, count - 1)).map((item, index) => {
    const text = getBestBlankChoiceText(item, sentenceContext) ?? item.expression;

    return {
      id: `${seed ?? correctGrammar.id}-distractor-${index + 1}`,
      text,
      grammarId: item.id,
      baseExpression: item.expression,
      conjugatedExpression: text,
      isSimilarDistractor: true,
    };
  });

  return randomize([correctChoice, ...distractors], "fill-blank-final").slice(0, count);
}
