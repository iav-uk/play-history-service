CREATE TABLE IF NOT EXISTS gdpr_tombstones (
  user_id UUID PRIMARY KEY,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tombstones_deleted_at
  ON gdpr_tombstones (deleted_at DESC);
