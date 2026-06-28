import { createClient } from "@/lib/supabase/server";
import {
  buildDiscoverCategoryViews,
  buildUserCategoryViews,
} from "@/lib/category-utils";
import type { CustomCategory, UserCategoryView } from "@/types/database";

async function getPublicRecipeCategoryCounts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("category_id, custom_category_id")
    .eq("is_public", true);

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

async function getPublicCustomCategories(): Promise<
  (CustomCategory & { authorName?: string })[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "custom_category:custom_categories(id, user_id, name, slug, author:profiles!custom_categories_user_id_fkey(display_name))"
    )
    .eq("is_public", true)
    .not("custom_category_id", "is", null);

  if (error || !data) return [];

  const map = new Map<string, CustomCategory & { authorName?: string }>();

  for (const row of data) {
    const raw = row.custom_category as unknown as
      | (CustomCategory & {
          author?: { display_name?: string } | { display_name?: string }[] | null;
        })
      | null;
    if (!raw?.id || map.has(raw.id)) continue;

    const author = raw.author;
    const authorName = Array.isArray(author)
      ? author[0]?.display_name?.trim()
      : author?.display_name?.trim();

    map.set(raw.id, {
      id: raw.id,
      user_id: raw.user_id,
      name: raw.name,
      slug: raw.slug,
      authorName: authorName || undefined,
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "de")
  );
}

export async function getDiscoverCategories(): Promise<UserCategoryView[]> {
  const supabase = await createClient();

  const [{ data: standard, error: standardError }, custom, recipeCounts] =
    await Promise.all([
      supabase.from("recipe_categories").select("*").order("sort_order"),
      getPublicCustomCategories(),
      getPublicRecipeCategoryCounts(),
    ]);

  if (standardError) {
    console.error("recipe_categories query failed:", standardError.message);
    return [];
  }

  return buildDiscoverCategoryViews(standard ?? [], custom, recipeCounts);
}

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
