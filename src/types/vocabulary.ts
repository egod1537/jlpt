import type { JlptLevel } from "./grammar";

export interface VocabularyItem {
  id: string;
  level: JlptLevel;
  word: string;
  reading: string;
  meaningKo: string;
  partOfSpeech: string;
  exampleIds: string[];
  confusingWordIds: string[];
  tags: string[];
}
