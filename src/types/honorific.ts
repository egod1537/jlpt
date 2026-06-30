export type HonorificCategory =
  | "이동·존재"
  | "식사"
  | "행위"
  | "발화·인지"
  | "수수"
  | "정형 표현";

export interface HonorificEntry {
  id: string;
  category: HonorificCategory;
  standard: string;
  meaningKo: string;
  respectful: string[];
  humbleRecipient: string[];
  humbleNeutral: string[];
  note?: string;
}

export interface HonorificPattern {
  id: string;
  standard: string;
  respectful: string;
  humble: string;
  status: "confirmed" | "uncertain";
  note?: string;
}

export interface HonorificQuizQuestion {
  id: string;
  prompt: string;
  context: string;
  choices: string[];
  answer: string;
  explanation: string;
}
