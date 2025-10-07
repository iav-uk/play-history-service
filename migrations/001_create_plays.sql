CREATE TABLE IF NOT EXISTS plays (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  device TEXT NOT NULL,
  playback_duration INTEGER NOT NULL CHECK (playback_duration >= 0),
  played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_plays_user_playedat'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_plays_user_playedat ON plays (user_id, played_at DESC);
  END IF;
END $$;
