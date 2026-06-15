-- RezeptVault – Initial Schema
-- Für ein NEUES Supabase-Projekt. Nicht mit bestehenden Projekten verbinden.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE difficulty_level AS ENUM ('einfach', 'mittel', 'schwer');
CREATE TYPE meal_type AS ENUM ('fruehstueck', 'mittagessen', 'abendessen', 'snack');

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE recipe_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE custom_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- ============================================================
-- RECIPES
-- ============================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  category_id UUID REFERENCES recipe_categories(id) ON DELETE SET NULL,
  custom_category_id UUID REFERENCES custom_categories(id) ON DELETE SET NULL,
  servings INT NOT NULL DEFAULT 4 CHECK (servings > 0),
  cook_time_minutes INT DEFAULT 30 CHECK (cook_time_minutes >= 0),
  difficulty difficulty_level NOT NULL DEFAULT 'mittel',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  parent_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  original_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  is_variant BOOLEAN NOT NULL DEFAULT FALSE,
  is_preferred_variant BOOLEAN NOT NULL DEFAULT FALSE,
  average_rating NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  rating_count INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_is_public ON recipes(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_recipes_title_trgm ON recipes USING GIN (title gin_trgm_ops);
CREATE INDEX idx_recipes_original ON recipes(original_recipe_id) WHERE original_recipe_id IS NOT NULL;

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE recipe_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, tag)
);

CREATE INDEX idx_recipe_tags_tag ON recipe_tags(tag);
CREATE INDEX idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);

-- ============================================================
-- INGREDIENTS & STEPS
-- ============================================================
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_name_trgm ON recipe_ingredients USING GIN (name gin_trgm_ops);

CREATE TABLE recipe_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);

-- ============================================================
-- RATINGS & COMMENTS
-- ============================================================
CREATE TABLE recipe_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);

CREATE TABLE recipe_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipe_comments_recipe_id ON recipe_comments(recipe_id);

-- ============================================================
-- FAVORITES
-- ============================================================
CREATE TABLE recipe_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

CREATE INDEX idx_recipe_favorites_user_id ON recipe_favorites(user_id);

-- ============================================================
-- VARIANTS (metadata linking)
-- ============================================================
CREATE TABLE recipe_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  variant_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(variant_recipe_id)
);

CREATE INDEX idx_recipe_variants_original ON recipe_variants(original_recipe_id);
CREATE INDEX idx_recipe_variants_user ON recipe_variants(user_id);

-- ============================================================
-- MEAL PLANNING
-- ============================================================
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE TABLE meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  meal_type meal_type NOT NULL DEFAULT 'abendessen',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_plan_entries_plan ON meal_plan_entries(meal_plan_id);

-- ============================================================
-- SHOPPING LISTS
-- ============================================================
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Einkaufsliste',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recipe_ratings_updated_at BEFORE UPDATE ON recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER recipe_comments_updated_at BEFORE UPDATE ON recipe_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Recalculate recipe rating average
CREATE OR REPLACE FUNCTION update_recipe_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_recipe_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_recipe_id := OLD.recipe_id;
  ELSE
    target_recipe_id := NEW.recipe_id;
  END IF;

  UPDATE recipes SET
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2) FROM recipe_ratings WHERE recipe_id = target_recipe_id
    ), 0),
    rating_count = (SELECT COUNT(*) FROM recipe_ratings WHERE recipe_id = target_recipe_id)
  WHERE id = target_recipe_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recipe_ratings_stats
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
  FOR EACH ROW EXECUTE FUNCTION update_recipe_rating_stats();

-- Seed predefined categories
INSERT INTO recipe_categories (name, slug, icon, sort_order) VALUES
  ('Frühstück', 'fruehstueck', 'sunrise', 1),
  ('Mittagessen', 'mittagessen', 'utensils', 2),
  ('Abendessen', 'abendessen', 'moon', 3),
  ('Dessert', 'dessert', 'cake', 4),
  ('Backen', 'backen', 'croissant', 5),
  ('Snacks', 'snacks', 'cookie', 6),
  ('Getränke', 'getraenke', 'coffee', 7);
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
-- RezeptVault – Storage Buckets & Policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Recipe images: public read, authenticated upload to own folder
CREATE POLICY "Recipe images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

CREATE POLICY "Users can upload recipe images to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own recipe images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own recipe images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatars
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
