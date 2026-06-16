-- Typisierte Einkaufslisten: Wochenplan-Zutaten + Weitere Zutaten
ALTER TABLE shopping_lists
  ADD COLUMN IF NOT EXISTS list_type TEXT NOT NULL DEFAULT 'general'
  CHECK (list_type IN ('general', 'plan', 'extras'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_lists_user_plan
  ON shopping_lists(user_id) WHERE list_type = 'plan';

CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_lists_user_extras
  ON shopping_lists(user_id) WHERE list_type = 'extras';
