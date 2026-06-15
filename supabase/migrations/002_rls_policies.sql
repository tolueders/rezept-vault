-- RezeptVault – Row Level Security Policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE POLICY "Categories are viewable by everyone"
  ON recipe_categories FOR SELECT USING (true);

CREATE POLICY "Users can view own custom categories"
  ON custom_categories FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom categories"
  ON custom_categories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom categories"
  ON custom_categories FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom categories"
  ON custom_categories FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RECIPES
-- ============================================================
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public recipes are viewable by everyone"
  ON recipes FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RECIPE CHILD TABLES (inherit access via recipe)
-- ============================================================
CREATE POLICY "Tags viewable if recipe accessible"
  ON recipe_tags FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r WHERE r.id = recipe_id
      AND (r.user_id = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Users can manage tags on own recipes"
  ON recipe_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Ingredients viewable if recipe accessible"
  ON recipe_ingredients FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r WHERE r.id = recipe_id
      AND (r.user_id = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Users can manage ingredients on own recipes"
  ON recipe_ingredients FOR ALL USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Steps viewable if recipe accessible"
  ON recipe_steps FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r WHERE r.id = recipe_id
      AND (r.user_id = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Users can manage steps on own recipes"
  ON recipe_steps FOR ALL USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
  );

-- ============================================================
-- RATINGS
-- ============================================================
CREATE POLICY "Ratings viewable if recipe accessible"
  ON recipe_ratings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r WHERE r.id = recipe_id
      AND (r.user_id = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Authenticated users can rate accessible recipes"
  ON recipe_ratings FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM recipes r WHERE r.id = recipe_id
      AND (r.user_id = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Users can update own ratings"
  ON recipe_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON recipe_ratings FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE POLICY "Comments viewable if recipe accessible"
  ON recipe_comments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes r WHERE r.id = recipe_id
      AND (r.user_id = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Authenticated users can comment on accessible recipes"
  ON recipe_comments FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM recipes r WHERE r.id = recipe_id
      AND (r.user_id = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Users can update own comments"
  ON recipe_comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON recipe_comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE POLICY "Users can view own favorites"
  ON recipe_favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON recipe_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON recipe_favorites FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- VARIANTS
-- ============================================================
CREATE POLICY "Users can view own variants"
  ON recipe_variants FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create variants"
  ON recipe_variants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own variants"
  ON recipe_variants FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own variants"
  ON recipe_variants FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- MEAL PLANS
-- ============================================================
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create meal plans"
  ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Meal plan entries via own plans"
  ON meal_plan_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own meal plan entries"
  ON meal_plan_entries FOR ALL USING (
    EXISTS (SELECT 1 FROM meal_plans mp WHERE mp.id = meal_plan_id AND mp.user_id = auth.uid())
  );

-- ============================================================
-- SHOPPING LISTS
-- ============================================================
CREATE POLICY "Users can view own shopping lists"
  ON shopping_lists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create shopping lists"
  ON shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON shopping_lists FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON shopping_lists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Shopping items via own lists"
  ON shopping_list_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM shopping_lists sl WHERE sl.id = shopping_list_id AND sl.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own shopping items"
  ON shopping_list_items FOR ALL USING (
    EXISTS (SELECT 1 FROM shopping_lists sl WHERE sl.id = shopping_list_id AND sl.user_id = auth.uid())
  );
