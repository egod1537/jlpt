export type WordStatus = "ready" | "needs-review";
export type Rating = "again" | "hard" | "good" | "easy";

export interface CollectionMeta {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  dataFile: string;
  csvFile: string;
  wordCount: number;
  sourceRecordCount: number;
}

export interface CollectionIndex {
  schemaVersion: string;
  generatedAt: string;
  total: number;
  collections: CollectionMeta[];
}

export interface Example { ja: string; ko: string | null }

export interface WordSource {
  collectionId: string;
  sourceType: "attachment" | "html-artifact" | "conversation-recovery";
  sourceFile: string;
  line: number | null;
  year: number | null;
  section: string | null;
}

export interface Word {
  id: string;
  term: string;
  reading: string | null;
  meanings: string[];
  primaryMeaning: string | null;
  nuance: string | null;
  partOfSpeech: string[];
  jlptLevels: string[];
  years: number[];
  categories: string[];
  collectionIds: string[];
  relatedTerms: string[];
  examples: Example[];
  sources: WordSource[];
  status: WordStatus;
}

export interface WordBook {
  schemaVersion: string;
  generatedAt: string;
  id: string;
  title: string;
  category: string;
  createdAt: string;
  sourceSession: string;
  sourceFiles: unknown[];
  sourceRecordCount: number;
  total: number;
  words: Word[];
}

export interface SiteStats {
  schemaVersion: string;
  generatedAt: string;
  sourceSessions: number;
  sourceFiles: number;
  recoveredRecords: number;
  wordbookFiles: number;
  wordEntries: number;
  uniqueAcrossWordbooks: number;
  readyEntries: number;
  needsReviewEntries: number;
  deduplicatedWithinWordbooks: number;
  unparsedCandidateLines: number;
  byCategory: Record<string, number>;
  byJlptLevel: Record<string, number>;
}

export interface ReviewIssue {
  id: string;
  collectionId: string;
  term: string;
  reading: string | null;
  primaryMeaning: string | null;
  issues: string[];
}

export interface ReviewIndex { schemaVersion: string; generatedAt: string; total: number; items: ReviewIssue[] }

export interface SearchOccurrence {
  collectionId: string;
  wordId: string;
  term: string;
  reading: string | null;
  meanings: string[];
  primaryMeaning: string | null;
  nuance: string | null;
  jlptLevels: string[];
  years: number[];
  status: WordStatus;
  position: number;
}

export interface SearchIndex { schemaVersion: string; generatedAt: string; total: number; occurrences: SearchOccurrence[] }
export interface SearchGroup { wordId: string; representative: SearchOccurrence; occurrences: SearchOccurrence[]; score: number; firstOrder: number }

export interface StudyRecord {
  wordId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
  lastRating: Rating | null;
  lapses: number;
  knownFlag?: boolean;
}

export interface ProgressState { schemaVersion: 1; updatedAt: string; records: Record<string, StudyRecord> }

export interface StudySessionState {
  schemaVersion: 1;
  updatedAt: string;
  books: string[];
  mode: "all" | "unseen" | "due";
  includeReview: boolean;
  wordIds: string[];
  position: number;
  revealed: boolean;
  ratings: Record<string, Rating>;
}

export interface StudyCard { wordId: string; representative: { word: Word; book: WordBook }; occurrences: Array<{ word: Word; book: WordBook }> }
