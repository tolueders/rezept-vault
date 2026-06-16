-- Übergeordnete Rezeptkategorien vereinheitlichen
-- Mittagessen/Abendessen → Hauptgericht, Snacks → Snack, Suppe neu

INSERT INTO recipe_categories (name, slug, icon, sort_order) VALUES
  ('Frühstück', 'fruehstueck', 'sunrise', 1),
  ('Hauptgericht', 'hauptgericht', 'utensils', 2),
  ('Dessert', 'dessert', 'cake', 3),
  ('Snack', 'snack', 'cookie', 4),
  ('Suppe', 'suppe', 'soup', 5),
  ('Backen', 'backen', 'croissant', 6),
  ('Getränke', 'getraenke', 'coffee', 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon;

-- Rezepte von Mittagessen/Abendessen nach Hauptgericht
UPDATE recipes
SET category_id = (SELECT id FROM recipe_categories WHERE slug = 'hauptgericht')
WHERE category_id IN (
  SELECT id FROM recipe_categories WHERE slug IN ('mittagessen', 'abendessen')
);

-- Alte Snacks-Kategorie auf Snack umstellen
UPDATE recipes
SET category_id = (SELECT id FROM recipe_categories WHERE slug = 'snack')
WHERE category_id = (SELECT id FROM recipe_categories WHERE slug = 'snacks');

-- Veraltete Kategorien entfernen
DELETE FROM recipe_categories
WHERE slug IN ('mittagessen', 'abendessen', 'snacks');
