CREATE TABLE import_previews_without_auth (
  preview_id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  format TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  source_blob BLOB NOT NULL,
  mapping_json TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  committed_at TEXT
);

INSERT INTO import_previews_without_auth (
  preview_id, mime, format, source_hash, source_blob,
  mapping_json, summary_json, expires_at, committed_at
)
SELECT
  preview_id, mime, format, source_hash, source_blob,
  mapping_json, summary_json, expires_at, committed_at
FROM import_previews;

DROP TABLE import_previews;
ALTER TABLE import_previews_without_auth RENAME TO import_previews;
CREATE INDEX idx_import_previews_expiry ON import_previews(expires_at);
