import { createClient } from "@/lib/supabase/server";
import type { Recipe, RecipeWithDetails } from "@/types/database";
import { RECIPES_PER_PAGE } from "@/lib/constants";

export async function getRecipeById(id: string): Promise<RecipeWithDetails | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      `
      *,
      category:recipe_categories(*),
      custom_category:custom_categories(*),
      tags:recipe_tags(*),
      ingredients:recipe_ingredients(*),
      steps:recipe_steps(*),
      author:profiles!recipes_user_id_fkey(*)
    `
    )
    .eq("id", id)
    .single();

  if (!recipe) return null;

  if (!recipe.is_public && recipe.user_id !== user?.id) return null;

  let is_favorited = false;
  let user_rating: number | null = null;

  if (user) {
    const [{ data: fav }, { data: rating }] = await Promise.all([
      supabase
        .from("recipe_favorites")
        .select("id")
        .eq("recipe_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("recipe_ratings")
        .select("rating")
        .eq("recipe_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    is_favorited = !!fav;
    user_rating = rating?.rating ?? null;
  }

  return {
    ...recipe,
    tags: recipe.tags?.sort((a: { tag: string }, b: { tag: string }) =>
      a.tag.localeCompare(b.tag)
    ) ?? [],
    ingredients:
      recipe.ingredients?.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ) ?? [],
    steps:
      recipe.steps?.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ) ?? [],
    is_favorited,
    user_rating,
  } as RecipeWithDetails;
}

export async function getRecipeBySlug(slug: string): Promise<RecipeWithDetails | null> {
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      `
      *,
      category:recipe_categories(*),
      tags:recipe_tags(*),
      ingredients:recipe_ingredients(*),
      steps:recipe_steps(*),
      author:profiles!recipes_user_id_fkey(*)
    `
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!recipe) return null;

  return {
    ...recipe,
    ingredients:
      recipe.ingredients?.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ) ?? [],
    steps:
      recipe.steps?.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ) ?? [],
  } as RecipeWithDetails;
}

export async function getUserRecipes(
  page = 1,
  search = "",
  categoryId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { recipes: [], total: 0 };

  let query = supabase
    .from("recipes")
    .select(
      "*, category:recipe_categories(*), tags:recipe_tags(*)",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * RECIPES_PER_PAGE, page * RECIPES_PER_PAGE - 1);

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, count } = await query;
  return { recipes: data || [], total: count || 0 };
}

export async function searchRecipes(query: string, categoryId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !query.trim()) return [];

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, category:recipe_categories(*), tags:recipe_tags(*)")
    .eq("user_id", user.id)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(20);

  if (categoryId) {
    return (recipes || []).filter((r) => r.category_id === categoryId);
  }

  const { data: byIngredient } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id")
    .ilike("name", `%${query}%`);

  if (byIngredient?.length) {
    const ids = byIngredient.map((i) => i.recipe_id);
    const { data: extraRecipes } = await supabase
      .from("recipes")
      .select("*, category:recipe_categories(*), tags:recipe_tags(*)")
      .eq("user_id", user.id)
      .in("id", ids);

    const combined = [...(recipes || []), ...(extraRecipes || [])];
    const unique = Array.from(new Map(combined.map((r) => [r.id, r])).values());
    return unique;
  }

  return recipes || [];
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipe_categories")
    .select("*")
    .order("sort_order");
  return data || [];
}

export async function getFavoriteRecipes(): Promise<
  (Recipe & { category?: { id: string; name: string; slug: string } | null; tags?: { id: string; tag: string }[] })[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("recipe_favorites")
    .select(
      "recipe:recipes(*, category:recipe_categories(*), tags:recipe_tags(*))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!data) return [];

  const recipes: (Recipe & {
    category?: { id: string; name: string; slug: string } | null;
    tags?: { id: string; tag: string }[];
  })[] = [];

  for (const row of data) {
    const recipe = row.recipe as unknown as (Recipe & {
      category?: { id: string; name: string; slug: string } | null;
      tags?: { id: string; tag: string }[];
    }) | null;
    if (recipe && typeof recipe === "object" && "id" in recipe) {
      recipes.push(recipe);
    }
  }

  return recipes;
}

export async function getRecipeComments(recipeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipe_comments")
    .select("*, profile:profiles(*)")
    .eq("recipe_id", recipeId)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function getRecipeVariants(originalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("recipe_variants")
    .select("*, variant:recipes!recipe_variants_variant_recipe_id_fkey(*)")
    .eq("original_recipe_id", originalId)
    .eq("user_id", user.id);
  return data || [];
}
