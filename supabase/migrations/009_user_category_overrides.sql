-- Persönliche Anzeigenamen für Standard-Kategorien
CREATE TABLE user_category_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_category_id UUID NOT NULL REFERENCES recipe_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, recipe_category_id)
);

CREATE INDEX idx_user_category_overrides_user ON user_category_overrides(user_id);

ALTER TABLE user_category_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own category overrides"
  ON user_category_overrides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category overrides"
  ON user_category_overrides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category overrides"
  ON user_category_overrides FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own category overrides"
  ON user_category_overrides FOR DELETE
  USING (auth.uid() = user_id);
