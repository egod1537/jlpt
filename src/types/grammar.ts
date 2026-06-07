export type JlptLevel = "N1" | "N2" | "N3" | "N4" | "N5";

export type RegisterLevel = "회화체" | "중립" | "문어체";

export interface GrammarExample {
  id: string;
  japanese: string;
  korean: string;
  blankedJapanese?: string;
  answer?: string;
  explanation?: string;
}

export interface GrammarItem {
  id: string;
  no: number;
  noLabel: string;
  level: JlptLevel;
  expression: string;
  connection: string;
  meaningKo: string;
  nuanceKo: string;
  register: RegisterLevel;
  frequency: 1 | 2 | 3;
  similarGrammarIds: string[];
  similarExpressionNames: string[];
  warningKo?: string;
  examples: GrammarExample[];
  tags: string[];
}

export interface GrammarCategory {
  label: string;
  predicate: (item: GrammarItem) => boolean;
}
