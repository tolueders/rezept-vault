-- Neue Rezepte standardmäßig öffentlich
ALTER TABLE recipes ALTER COLUMN is_public SET DEFAULT true;
