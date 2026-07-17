import kanji from "./n1Kanji.json";

export const N1_KANJI_SET_SIZE = 50;

export interface N1KanjiCard {
  n: number;
  jp: string;
  rd: string;
  kr: string;
  examples: string[];
  sourceWordCount: number;
  needsReview?: boolean;
  qualityFlags?: string[];
  variantOf?: string;
}

export const n1Kanji: readonly N1KanjiCard[] = kanji;
