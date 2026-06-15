export type DifficultyLevel = "einfach" | "mittel" | "schwer";
export type MealType = "fruehstueck" | "mittagessen" | "abendessen" | "snack";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

export interface CustomCategory {
  id: string;
  user_id: string;
  name: string;
  slug: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  category_id: string | null;
  custom_category_id: string | null;
  servings: number;
  cook_time_minutes: number;
  difficulty: DifficultyLevel;
  is_public: boolean;
  parent_recipe_id: string | null;
  original_recipe_id: string | null;
  is_variant: boolean;
  is_preferred_variant: boolean;
  average_rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeTag {
  id: string;
  recipe_id: string;
  tag: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number;
  unit: string;
  sort_order: number;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  instruction: string;
  sort_order: number;
}

export interface RecipeRating {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

export interface RecipeComment {
  id: string;
  recipe_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface RecipeFavorite {
  id: string;
  recipe_id: string;
  user_id: string;
}

export interface RecipeVariant {
  id: string;
  original_recipe_id: string;
  variant_recipe_id: string;
  user_id: string;
  variant_name: string;
  is_preferred: boolean;
}

export interface MealPlan {
  id: string;
  user_id: string;
  week_start: string;
}

export interface MealPlanEntry {
  id: string;
  meal_plan_id: string;
  day_of_week: number;
  recipe_id: string;
  meal_type: MealType;
  sort_order: number;
  recipe?: Recipe;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  meal_plan_id: string | null;
  title: string;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  sort_order: number;
}

export interface RecipeWithDetails extends Recipe {
  category?: RecipeCategory | null;
  custom_category?: CustomCategory | null;
  tags: RecipeTag[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  author?: Profile;
  is_favorited?: boolean;
  user_rating?: number | null;
}

export interface RecipeFormData {
  title: string;
  description: string;
  category_id: string;
  custom_category_id?: string;
  servings: number;
  cook_time_minutes: number;
  difficulty: DifficultyLevel;
  is_public: boolean;
  tags: string[];
  ingredients: { name: string; amount: number; unit: string }[];
  steps: { instruction: string }[];
}

export interface GeminiRecipeExtraction {
  title: string;
  description?: string;
  servings?: number;
  cook_time_minutes?: number;
  difficulty?: DifficultyLevel;
  ingredients: { name: string; amount: number; unit: string }[];
  steps: { instruction: string }[];
}

export interface SearchFilters {
  query: string;
  category?: string;
  tags?: string[];
}
