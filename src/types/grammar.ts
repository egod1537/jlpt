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

export interface BlankChoiceForm {
  formId: string;
  label: string;
  text: string;
  requiredContext?: string;
  note?: string;
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
  blankChoiceForms?: BlankChoiceForm[];
}

export interface FillBlankSentenceContext {
  requiredConnectionType:
    | "V_PAST"
    | "V_DICTIONARY"
    | "V_MASU_STEM"
    | "V_NAI_STEM"
    | "NOUN"
    | "NA_ADJ"
    | "I_ADJ"
    | "PLAIN_FORM"
    | "ANY";
  semanticTags: string[];
  expectsNegativeConclusion?: boolean;
  expectsDutyOrResponsibility?: boolean;
  expectsBadResult?: boolean;
  expectsPossibility?: boolean;
  expectsContrast?: boolean;
}

export interface GrammarCategory {
  label: string;
  predicate: (item: GrammarItem) => boolean;
}
