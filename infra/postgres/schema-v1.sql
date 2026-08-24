BEGIN;

CREATE TABLE schema_migrations (
  version integer PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE operational_records (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('project','task','habit','journal_metadata','inbox_item','agent','skill','approval','progress')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  status text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  sensitive_ciphertext text,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX operational_records_kind_updated_idx
  ON operational_records (kind, updated_at DESC);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY,
  action text NOT NULL,
  entity_kind text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations(version) VALUES (1);

COMMIT;
