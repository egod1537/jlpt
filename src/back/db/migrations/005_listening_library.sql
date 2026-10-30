CREATE TABLE listening_folders (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES listening_folders(id),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  sort_index INTEGER NOT NULL DEFAULT 0,
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_listening_folders_parent_sort
  ON listening_folders(parent_id, sort_index, name) WHERE deleted_at IS NULL;

CREATE TABLE listening_sets (
  id TEXT PRIMARY KEY,
  folder_id TEXT REFERENCES listening_folders(id),
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description TEXT NOT NULL DEFAULT '',
  sort_index INTEGER NOT NULL DEFAULT 0,
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_listening_sets_folder_sort
  ON listening_sets(folder_id, sort_index, title) WHERE deleted_at IS NULL;
CREATE INDEX idx_listening_sets_updated
  ON listening_sets(updated_at DESC, id) WHERE deleted_at IS NULL;

CREATE TABLE listening_audio (
  id TEXT PRIMARY KEY,
  set_id TEXT NOT NULL REFERENCES listening_sets(id),
  original_name TEXT NOT NULL,
  stored_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  sample_rate INTEGER CHECK (sample_rate IS NULL OR sample_rate > 0),
  channels INTEGER CHECK (channels IS NULL OR channels > 0),
  codec_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('uploaded','queued','transcribing','transcribed','correcting','ready','failed','missing')),
  script_version_id TEXT,
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  last_played_at TEXT,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (script_version_id) REFERENCES listening_transcript_versions(id)
);
CREATE INDEX idx_listening_audio_set_created
  ON listening_audio(set_id, created_at DESC, id) WHERE deleted_at IS NULL;
CREATE INDEX idx_listening_audio_status
  ON listening_audio(status, updated_at, id) WHERE deleted_at IS NULL;
CREATE INDEX idx_listening_audio_sha256 ON listening_audio(sha256);

CREATE TABLE listening_transcript_versions (
  id TEXT PRIMARY KEY,
  audio_id TEXT NOT NULL REFERENCES listening_audio(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL CHECK (version_no > 0),
  kind TEXT NOT NULL CHECK (kind IN ('whisper_raw','gpt_processed','manual_edit')),
  based_on_id TEXT REFERENCES listening_transcript_versions(id),
  language TEXT NOT NULL DEFAULT 'ja',
  raw_payload_json TEXT NOT NULL,
  model_name TEXT,
  prompt_version TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(audio_id, version_no)
);
CREATE INDEX idx_listening_versions_audio_created
  ON listening_transcript_versions(audio_id, version_no DESC);
CREATE TRIGGER trg_listening_whisper_raw_immutable
BEFORE UPDATE ON listening_transcript_versions
WHEN OLD.kind = 'whisper_raw'
BEGIN
  SELECT RAISE(ABORT, 'whisper raw transcript is immutable');
END;

CREATE TABLE listening_script_segments (
  id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES listening_transcript_versions(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
  end_ms INTEGER NOT NULL CHECK (end_ms > start_ms),
  speaker TEXT,
  ja TEXT NOT NULL DEFAULT '',
  ko TEXT,
  needs_review INTEGER NOT NULL DEFAULT 0 CHECK (needs_review IN (0, 1)),
  review_note TEXT,
  source_segment_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(source_segment_ids_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(version_id, ordinal)
);
CREATE INDEX idx_listening_segments_version_time
  ON listening_script_segments(version_id, start_ms, end_ms, ordinal);

CREATE TABLE listening_jobs (
  id TEXT PRIMARY KEY,
  audio_id TEXT NOT NULL REFERENCES listening_audio(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transcribe','gpt_process')),
  state TEXT NOT NULL CHECK (state IN ('queued','running','waiting_auth','completed','failed','canceled')),
  stage TEXT NOT NULL CHECK (stage IN ('queued','transcribing','transcribed','correcting','ready','failed','canceled')),
  attempt INTEGER NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 4 CHECK (max_attempts > 0),
  lease_owner TEXT,
  lease_expires_at TEXT,
  next_run_at TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  idempotency_key TEXT NOT NULL UNIQUE,
  input_version_id TEXT REFERENCES listening_transcript_versions(id),
  output_version_id TEXT REFERENCES listening_transcript_versions(id),
  provider_job_id TEXT,
  provider_payload_json TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  canceled_at TEXT
);
CREATE INDEX idx_listening_jobs_claim
  ON listening_jobs(state, next_run_at, lease_expires_at, created_at);
CREATE INDEX idx_listening_jobs_audio_created
  ON listening_jobs(audio_id, created_at DESC);
CREATE UNIQUE INDEX idx_listening_jobs_active_audio_type
  ON listening_jobs(audio_id, type)
  WHERE state IN ('queued','running','waiting_auth');

CREATE TABLE listening_audio_progress (
  audio_id TEXT PRIMARY KEY REFERENCES listening_audio(id) ON DELETE CASCADE,
  position_ms INTEGER NOT NULL DEFAULT 0 CHECK (position_ms >= 0),
  playback_rate REAL NOT NULL DEFAULT 1 CHECK (playback_rate BETWEEN 0.5 AND 3),
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TEXT NOT NULL
);

CREATE TABLE listening_audit_log (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  audio_id TEXT,
  job_id TEXT,
  version_id TEXT,
  detail_code TEXT,
  occurred_at TEXT NOT NULL
);
CREATE INDEX idx_listening_audit_occurred ON listening_audit_log(occurred_at DESC, seq DESC);
