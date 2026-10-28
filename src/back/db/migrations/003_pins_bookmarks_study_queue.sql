ALTER TABLE folders ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1));

ALTER TABLE study_sessions ADD COLUMN queue_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE study_sessions ADD COLUMN loop_mode INTEGER NOT NULL DEFAULT 0 CHECK (loop_mode IN (0, 1));
ALTER TABLE study_sessions ADD COLUMN results_json TEXT NOT NULL DEFAULT '[]';

CREATE TABLE bookmarks (
  entry_id TEXT PRIMARY KEY REFERENCES book_entries(entry_id) ON DELETE CASCADE,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_folders_pinned_order ON folders(pinned DESC, order_index, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookmarks_updated ON bookmarks(updated_at DESC);
CREATE INDEX idx_review_states_due_word ON review_states(due_at, word_id) WHERE due_at IS NOT NULL;
CREATE INDEX idx_entries_status_book_word ON book_entries(status, book_id, word_id) WHERE deleted_at IS NULL;
