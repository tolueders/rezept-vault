-- Cache für KI-Rezept-Scans (vermeidet doppelte Gemini-Aufrufe)
CREATE TABLE recipe_scan_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('image', 'text', 'url')),
  extraction JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_hash)
);

CREATE INDEX recipe_scan_cache_user_id_idx ON recipe_scan_cache(user_id);

ALTER TABLE recipe_scan_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own scan cache"
  ON recipe_scan_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own scan cache"
  ON recipe_scan_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scan cache"
  ON recipe_scan_cache FOR UPDATE
  USING (auth.uid() = user_id);
