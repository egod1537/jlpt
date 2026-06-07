import type { GrammarCategory, GrammarItem } from "../types/grammar";

export const grammarCategories: GrammarCategory[] = [
  { label: "전체", predicate: () => true },
  {
    label: "가능/불가능",
    predicate: (item) =>
      /得る|かねる|かねない|がたい|ようがない|わけにはいかない|ざるを得ない|っこない/.test(
        item.expression,
      ),
  },
  {
    label: "역접/대비",
    predicate: (item) => /ながら|ものの|とはいうものの|くせに|一方|つつ（역/.test(item.expression),
  },
  {
    label: "시간/순서",
    predicate: (item) =>
      /以来|たとたん|次第|うちに|たび|最中|折|に先立|際|ところだった|ようとして/.test(
        item.expression,
      ),
  },
  {
    label: "추측/판단",
    predicate: (item) => /ところをみると|のことだから|に相違ない|わけがない|わけではない/.test(item.expression),
  },
  {
    label: "정도/감탄",
    predicate: (item) =>
      /あまり|かぎりだ|ことか|ことだろう|といったら|たまらない|てならない|ものがある/.test(
        item.expression,
      ),
  },
  {
    label: "충고/의무",
    predicate: (item) => /べきだ|ことだ（충|ものだ\/もの|ものだ（감/.test(item.expression),
  },
  {
    label: "병렬/추가",
    predicate: (item) => /のみならず|ばかりか|はもとより|に加えて|やら/.test(item.expression),
  },
  {
    label: "범위/한정",
    predicate: (item) =>
      /かぎり|に限り|に限って|に限らず|にすぎない|ぬきで|を抜き|をはじめ|を問わず/.test(
        item.expression,
      ),
  },
];

export function getGrammarCategory(label: string): GrammarCategory {
  return grammarCategories.find((category) => category.label === label) ?? grammarCategories[0];
}

export function searchGrammar(items: readonly GrammarItem[], query: string): GrammarItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...items];
  }

  return items.filter((item) => {
    const searchableValues = [
      item.expression,
      item.meaningKo,
      item.nuanceKo,
      item.connection,
      item.warningKo ?? "",
      ...item.similarExpressionNames,
      ...item.examples.flatMap((example) => [example.japanese, example.korean]),
    ];

    return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

export function filterGrammarByCategory(items: readonly GrammarItem[], categoryLabel: string): GrammarItem[] {
  const category = getGrammarCategory(categoryLabel);
  return items.filter(category.predicate);
}

export function getFrequencyStars(frequency: GrammarItem["frequency"]): string {
  return `${"★".repeat(frequency)}${"☆".repeat(3 - frequency)}`;
}

export function getRegisterColor(register: GrammarItem["register"]): string {
  return {
    회화체: "#68c868",
    중립: "#6898e8",
    문어체: "#e8c468",
  }[register];
}
