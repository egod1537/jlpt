export type GrammarExampleRecord = {
  japanese: string;
  korean: string;
};

export type GrammarNoteRecord = {
  id: string;
  bookId: string;
  position: number;
  pattern: string;
  reading: string;
  meaning: string;
  connection: string[];
  explanation: string;
  caution: string | null;
  examples: GrammarExampleRecord[];
  keywords: string[];
  notesMarkdown: string | null;
  sourceFile: string | null;
  sourceKind: "builtin" | "manual";
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type GrammarBookRecord = {
  id: string;
  title: string;
  description: string;
  level: string;
  type: "flashcard" | "book";
  markdown: string | null;
  sourceFile: string | null;
  sortOrder: number;
  sourceKind: "builtin" | "manual";
  revision: number;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
};

export type GrammarBookDetail = GrammarBookRecord & { notes: GrammarNoteRecord[] };

export type GrammarNoteInput = {
  id?: string;
  position?: number;
  pattern: string;
  reading?: string;
  meaning?: string;
  connection?: string[];
  explanation?: string;
  caution?: string | null;
  examples?: GrammarExampleRecord[];
  keywords?: string[];
  notesMarkdown?: string | null;
  sourceFile?: string | null;
};

export type GrammarBookInput = {
  id?: string;
  title: string;
  description?: string;
  level?: string;
  type?: "flashcard" | "book";
  markdown?: string | null;
  sourceFile?: string | null;
  sortOrder?: number;
  notes?: GrammarNoteInput[];
};
