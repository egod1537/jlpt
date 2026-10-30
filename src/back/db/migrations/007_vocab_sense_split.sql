CREATE TABLE vocab_sense_split_cache (
  input_hash TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (input_hash, model_name, prompt_version),
  CHECK (length(input_hash) = 64),
  CHECK (json_valid(result_json))
);

CREATE INDEX idx_vocab_sense_split_cache_created
  ON vocab_sense_split_cache(created_at);
