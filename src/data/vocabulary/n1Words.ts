import words from "./n1Words.json";

export const N1_WORD_SET_SIZE = 50;

export interface N1Word {
  n: number;
  jp: string;
  rd: string;
  kr: string;
  needsReview?: boolean;
  qualityFlags?: string[];
}

export const n1Words: readonly N1Word[] = words;
