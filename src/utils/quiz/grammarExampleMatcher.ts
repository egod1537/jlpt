import type { GrammarExample, GrammarItem } from "../../types/grammar";

export interface ExampleTargetMatch {
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

export function getRecallHint(expression: string): string | undefined {
  return expression.match(/（([가-힣][^）]*)）/)?.[1];
}

export function getRecallExpression(expression: string): string {
  return expression.replace(/（[가-힣][^）]*）/g, "").trim();
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

  return [
    ...new Set(
      conjugationVariants.filter((candidate) => candidate.length > 1),
    ),
  ].sort((left, right) => right.length - left.length);
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
      .sort(
        (left, right) =>
          right.target.length - left.target.length ||
          left.targetIndex - right.targetIndex,
      )
      .forEach((match) => {
        const overlapsLongerMatch = matches.some(
          (existing) =>
            existing.example.id === match.example.id &&
            existing.targetIndex <= match.targetIndex &&
            existing.targetIndex + existing.target.length >=
              match.targetIndex + match.target.length,
        );

        if (!overlapsLongerMatch) {
          matches.push(match);
        }
      });
  });

  return matches;
}

export function findExampleWithExpression(
  item: GrammarItem,
): ExampleTargetMatch {
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

export function blankTarget(match: ExampleTargetMatch): string {
  if (match.targetIndex < 0) {
    return `${match.example.japanese}　（　　　）`;
  }

  return `${match.example.japanese.slice(
    0,
    match.targetIndex,
  )}（　　　）${match.example.japanese.slice(
    match.targetIndex + match.target.length,
  )}`;
}
