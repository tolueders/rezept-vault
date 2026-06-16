import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/recipe-utils";
import { format } from "date-fns";

export async function getDashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = format(getWeekStart(), "yyyy-MM-dd");

  const [recipes, favorites, publicRecipes, mealPlan] = await Promise.all([
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("recipe_favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true),
    supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .maybeSingle(),
  ]);

  let plannedMeals = 0;
  if (mealPlan.data?.id) {
    const { count } = await supabase
      .from("meal_plan_entries")
      .select("id", { count: "exact", head: true })
      .eq("meal_plan_id", mealPlan.data.id);
    plannedMeals = count ?? 0;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    displayName: profile?.display_name || "du",
    recipeCount: recipes.count ?? 0,
    favoriteCount: favorites.count ?? 0,
    publicCount: publicRecipes.count ?? 0,
    plannedMeals,
  };
}
