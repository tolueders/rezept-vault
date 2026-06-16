-- Rezeptbesitzer dürfen verknüpfte Daten anderer Nutzer löschen (FK-Cascade + RLS)
CREATE POLICY "Recipe owners can delete favorites on own recipes"
  ON recipe_favorites FOR DELETE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Recipe owners can delete ratings on own recipes"
  ON recipe_ratings FOR DELETE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Recipe owners can delete comments on own recipes"
  ON recipe_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Recipe owners can delete meal plan entries for own recipes"
  ON meal_plan_entries FOR DELETE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
  );
