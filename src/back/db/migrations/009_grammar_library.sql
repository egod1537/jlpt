CREATE TABLE grammar_books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'N1',
  type TEXT NOT NULL CHECK (type IN ('flashcard', 'book')),
  markdown TEXT,
  source_file TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_kind TEXT NOT NULL DEFAULT 'manual' CHECK (source_kind IN ('builtin', 'manual')),
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_grammar_books_active_order
  ON grammar_books(sort_order, title, id) WHERE deleted_at IS NULL;

CREATE TABLE grammar_notes (
  book_id TEXT NOT NULL REFERENCES grammar_books(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  pattern TEXT NOT NULL,
  reading TEXT NOT NULL DEFAULT '',
  meaning TEXT NOT NULL DEFAULT '',
  connection_json TEXT NOT NULL DEFAULT '[]',
  explanation TEXT NOT NULL DEFAULT '',
  caution TEXT,
  examples_json TEXT NOT NULL DEFAULT '[]',
  keywords_json TEXT NOT NULL DEFAULT '[]',
  notes_markdown TEXT,
  source_file TEXT,
  source_kind TEXT NOT NULL DEFAULT 'manual' CHECK (source_kind IN ('builtin', 'manual')),
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  PRIMARY KEY (book_id, id)
);

CREATE INDEX idx_grammar_notes_active_order
  ON grammar_notes(book_id, position, id) WHERE deleted_at IS NULL;

CREATE TABLE grammar_catalog_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
