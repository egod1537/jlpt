CREATE TABLE owner_account (
  id TEXT PRIMARY KEY CHECK (id = 'owner'),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  password_changed_at TEXT NOT NULL
);

CREATE TABLE auth_sessions (
  token_hash TEXT PRIMARY KEY,
  csrf_token_hash TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES owner_account(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX idx_auth_sessions_owner ON auth_sessions(owner_id, expires_at);

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  parent_id TEXT REFERENCES folders(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE UNIQUE INDEX idx_folders_unique_active_name
  ON folders(COALESCE(parent_id, ''), name_normalized)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_folders_parent_order ON folders(parent_id, order_index) WHERE deleted_at IS NULL;

CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  folder_id TEXT REFERENCES folders(id),
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  order_index INTEGER NOT NULL DEFAULT 0,
  origin TEXT NOT NULL CHECK (origin IN ('seed', 'manual', 'import')),
  origin_ref TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_books_folder_order ON books(folder_id, order_index) WHERE deleted_at IS NULL;
CREATE INDEX idx_books_updated ON books(updated_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE word_keys (
  word_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  retired_at TEXT
);

CREATE TABLE book_entries (
  entry_id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id),
  word_id TEXT NOT NULL REFERENCES word_keys(word_id),
  position INTEGER NOT NULL,
  term TEXT NOT NULL,
  reading TEXT,
  meanings_json TEXT NOT NULL,
  primary_meaning TEXT,
  nuance TEXT,
  part_of_speech_json TEXT NOT NULL DEFAULT '[]',
  jlpt_levels_json TEXT NOT NULL DEFAULT '[]',
  years_json TEXT NOT NULL DEFAULT '[]',
  categories_json TEXT NOT NULL DEFAULT '[]',
  related_terms_json TEXT NOT NULL DEFAULT '[]',
  examples_json TEXT NOT NULL DEFAULT '[]',
  sources_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('ready', 'needs-review')),
  tags_json TEXT NOT NULL DEFAULT '[]',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE UNIQUE INDEX idx_entries_book_position ON book_entries(book_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_entries_book_cursor ON book_entries(book_id, position, entry_id);
CREATE INDEX idx_entries_word ON book_entries(word_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_entries_term ON book_entries(term);

CREATE TABLE review_events (
  event_id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL UNIQUE,
  word_id TEXT NOT NULL REFERENCES word_keys(word_id),
  rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
  occurred_at TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  session_id TEXT,
  review_context TEXT NOT NULL CHECK (review_context IN ('scheduled', 'manual', 'new')),
  scheduler_version TEXT NOT NULL
);
CREATE INDEX idx_review_events_occurred ON review_events(occurred_at);
CREATE INDEX idx_review_events_word ON review_events(word_id, occurred_at);

CREATE TABLE review_states (
  word_id TEXT PRIMARY KEY REFERENCES word_keys(word_id),
  scheduler_version TEXT NOT NULL,
  serialized_state_json TEXT NOT NULL,
  due_at TEXT,
  last_reviewed_at TEXT,
  last_rating TEXT CHECK (last_rating IS NULL OR last_rating IN ('again', 'hard', 'good', 'easy')),
  lapses INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  known_flag INTEGER CHECK (known_flag IS NULL OR known_flag IN (0, 1))
);
CREATE INDEX idx_review_states_due ON review_states(due_at) WHERE due_at IS NOT NULL;

CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY,
  book_ids_json TEXT NOT NULL,
  mode TEXT NOT NULL,
  include_review INTEGER NOT NULL CHECK (include_review IN (0, 1)),
  word_ids_json TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  revealed INTEGER NOT NULL DEFAULT 0 CHECK (revealed IN (0, 1)),
  ratings_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused')),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_study_sessions_status ON study_sessions(status, updated_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE client_operations (
  operation_id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  result_json TEXT NOT NULL,
  processed_at TEXT NOT NULL
);
CREATE INDEX idx_client_operations_device ON client_operations(device_id, processed_at);

CREATE TABLE sync_changes (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
  payload_json TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
CREATE INDEX idx_sync_changes_entity ON sync_changes(entity_type, entity_id, seq);

CREATE TABLE seed_imports (
  source_key TEXT PRIMARY KEY,
  source_sha256 TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  source_stats_json TEXT NOT NULL
);

CREATE TABLE legacy_imports (
  import_id TEXT PRIMARY KEY,
  source_hash TEXT NOT NULL UNIQUE,
  summary_json TEXT NOT NULL,
  imported_at TEXT NOT NULL
);

CREATE TABLE import_previews (
  preview_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES owner_account(id),
  mime TEXT NOT NULL,
  format TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  source_blob BLOB NOT NULL,
  mapping_json TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  committed_at TEXT
);
CREATE INDEX idx_import_previews_expiry ON import_previews(expires_at);

CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE login_attempts (
  attempt_key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT,
  updated_at TEXT NOT NULL
);
