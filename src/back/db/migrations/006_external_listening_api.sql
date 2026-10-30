CREATE TABLE external_listening_idempotency (
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  location TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (scope, idempotency_key),
  CHECK (length(idempotency_key) BETWEEN 1 AND 128),
  CHECK (json_valid(response_json))
);

CREATE INDEX idx_external_listening_idempotency_created
  ON external_listening_idempotency(created_at);
