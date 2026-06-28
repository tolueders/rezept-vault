-- Eigene Kategorien lesbar, wenn sie auf öffentlichen Rezepten verwendet werden (Entdecken-Filter)
CREATE POLICY "Public custom categories readable via public recipes"
  ON custom_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.custom_category_id = custom_categories.id
        AND recipes.is_public = true
    )
  );
