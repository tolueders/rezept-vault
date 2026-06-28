import { createClient } from "@/lib/supabase/server";
import { buildUserCategoryViews } from "@/lib/category-utils";
import type { CustomCategory, UserCategoryView } from "@/types/database";

async function getRecipeCategoryCounts(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("category_id, custom_category_id")
    .eq("user_id", userId);

  const byStandard: Record<string, number> = {};
  const byCustom: Record<string, number> = {};

  for (const recipe of data ?? []) {
    if (recipe.custom_category_id) {
      byCustom[recipe.custom_category_id] =
        (byCustom[recipe.custom_category_id] ?? 0) + 1;
    } else if (recipe.category_id) {
      byStandard[recipe.category_id] = (byStandard[recipe.category_id] ?? 0) + 1;
    }
  }

  return { byStandard, byCustom };
}

export async function getCustomCategories(): Promise<CustomCategory[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("custom_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) return [];
  return data || [];
}

export async function getUserCategories(): Promise<UserCategoryView[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [{ data: standard, error: standardError }, overridesResult, custom, recipeCounts] =
    await Promise.all([
      supabase.from("recipe_categories").select("*").order("sort_order"),
      supabase
        .from("user_category_overrides")
        .select("recipe_category_id, name")
        .eq("user_id", user.id),
      getCustomCategories(),
      getRecipeCategoryCounts(user.id),
    ]);

  if (standardError) {
    console.error("recipe_categories query failed:", standardError.message);
    return [];
  }

  const overrides =
    overridesResult.error?.code === "42P01"
      ? []
      : (overridesResult.data ?? []);

  if (overridesResult.error && overridesResult.error.code !== "42P01") {
    console.error("user_category_overrides query failed:", overridesResult.error.message);
  }

  return buildUserCategoryViews(
    standard ?? [],
    overrides,
    custom,
    recipeCounts
  );
}
