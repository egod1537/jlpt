import type { GrammarItem } from "../types/grammar";
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
