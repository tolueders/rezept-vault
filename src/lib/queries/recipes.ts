import { createClient } from "@/lib/supabase/server";
import { applyUserCategoryDisplayNames } from "@/lib/category-utils";
import { getUserCategories } from "@/lib/queries/categories";
import {
  applyCategoryFiltersToQuery,
  filterByCategoryFilters,
} from "@/lib/recipe-filter-utils";
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

  const result = {
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

  if (user && recipe.user_id === user.id) {
    const userCategories = await getUserCategories();
    return applyUserCategoryDisplayNames([result], userCategories)[0];
  }

  return result;
}

export async function getUserRecipeCopyId(
  userId: string,
  sourceRecipeId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("id")
    .eq("user_id", userId)
    .eq("parent_recipe_id", sourceRecipeId)
    .maybeSingle();
  return data?.id ?? null;
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
      "*, category:recipe_categories(*), custom_category:custom_categories(*), tags:recipe_tags(*)",
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
  const userCategories = await getUserCategories();
  return {
    recipes: applyUserCategoryDisplayNames(data || [], userCategories),
    total: count || 0,
  };
}

export async function searchRecipes(query: string, categoryFilters?: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const userCategories = await getUserCategories();
  const trimmed = query.trim();

  if (!trimmed) {
    let q = supabase
      .from("recipes")
      .select("*, category:recipe_categories(*), custom_category:custom_categories(*), tags:recipe_tags(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    q = applyCategoryFiltersToQuery(q, categoryFilters ?? []);
    const { data } = await q;
    return applyUserCategoryDisplayNames(
      filterByCategoryFilters(data || [], categoryFilters ?? []),
      userCategories
    );
  }

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, category:recipe_categories(*), custom_category:custom_categories(*), tags:recipe_tags(*)")
    .eq("user_id", user.id)
    .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
    .limit(20);

  const { data: tagMatches } = await supabase
    .from("recipe_tags")
    .select("recipe_id")
    .ilike("tag", `%${trimmed}%`);

  const { data: byIngredient } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id")
    .ilike("name", `%${trimmed}%`);

  const extraIds = [
    ...(tagMatches?.map((t) => t.recipe_id) ?? []),
    ...(byIngredient?.map((i) => i.recipe_id) ?? []),
  ];

  let extraRecipes: typeof recipes = [];
  if (extraIds.length) {
    const { data } = await supabase
      .from("recipes")
      .select("*, category:recipe_categories(*), custom_category:custom_categories(*), tags:recipe_tags(*)")
      .eq("user_id", user.id)
      .in("id", [...new Set(extraIds)]);
    extraRecipes = data || [];
  }

  const combined = [...(recipes || []), ...extraRecipes];
  const unique = Array.from(new Map(combined.map((r) => [r.id, r])).values());

  return applyUserCategoryDisplayNames(
    filterByCategoryFilters(unique, categoryFilters ?? []),
    userCategories
  );
}

export async function searchFavoriteRecipes(
  query: string,
  categoryFilters?: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const userCategories = await getUserCategories();

  const { data: favRows } = await supabase
    .from("recipe_favorites")
    .select("recipe_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const favoriteIds = favRows?.map((r) => r.recipe_id) ?? [];
  if (favoriteIds.length === 0) return [];

  const favoriteOrder = new Map(
    favRows?.map((row, index) => [row.recipe_id, index]) ?? []
  );

  const selectFields =
    "*, category:recipe_categories(*), custom_category:custom_categories(*), tags:recipe_tags(*)";

  const trimmed = query.trim();
  let results: Recipe[] = [];

  if (!trimmed) {
    let q = supabase.from("recipes").select(selectFields).in("id", favoriteIds);
    q = applyCategoryFiltersToQuery(q, categoryFilters ?? []);
    const { data } = await q;
    results = data || [];
  } else {
    const { data: recipes } = await supabase
      .from("recipes")
      .select(selectFields)
      .in("id", favoriteIds)
      .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
      .limit(20);

    const { data: tagMatches } = await supabase
      .from("recipe_tags")
      .select("recipe_id")
      .in("recipe_id", favoriteIds)
      .ilike("tag", `%${trimmed}%`);

    const { data: byIngredient } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id")
      .in("recipe_id", favoriteIds)
      .ilike("name", `%${trimmed}%`);

    const extraIds = [
      ...(tagMatches?.map((t) => t.recipe_id) ?? []),
      ...(byIngredient?.map((i) => i.recipe_id) ?? []),
    ];

    let extraRecipes: typeof recipes = [];
    if (extraIds.length) {
      const { data } = await supabase
        .from("recipes")
        .select(selectFields)
        .in("id", [...new Set(extraIds)]);
      extraRecipes = data || [];
    }

    const combined = [...(recipes || []), ...extraRecipes];
    const unique = Array.from(new Map(combined.map((r) => [r.id, r])).values());
    results = filterByCategoryFilters(unique, categoryFilters ?? []);
  }

  if (!trimmed) {
    results = filterByCategoryFilters(results, categoryFilters ?? []);
  }

  results.sort(
    (a, b) => (favoriteOrder.get(a.id) ?? 0) - (favoriteOrder.get(b.id) ?? 0)
  );

  return applyUserCategoryDisplayNames(results, userCategories);
}

export async function getPublicRecipes(
  page = 1,
  search = "",
  categoryId?: string
) {
  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select(
      "*, category:recipe_categories(*), custom_category:custom_categories(*), tags:recipe_tags(*), author:profiles!recipes_user_id_fkey(display_name)",
      { count: "exact" }
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range((page - 1) * RECIPES_PER_PAGE, page * RECIPES_PER_PAGE - 1);

  if (search.trim()) {
    query = query.or(
      `title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`
    );
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, count } = await query;
  return { recipes: data || [], total: count || 0 };
}

export async function searchPublicRecipes(
  query: string,
  categoryFilters?: string[]
) {
  const supabase = await createClient();
  const trimmed = query.trim();

  const selectFields =
    "*, category:recipe_categories(*), custom_category:custom_categories(*), tags:recipe_tags(*), author:profiles!recipes_user_id_fkey(display_name)";

  if (!trimmed) {
    let q = supabase
      .from("recipes")
      .select(selectFields)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);
    q = applyCategoryFiltersToQuery(q, categoryFilters ?? []);
    const { data } = await q;
    return filterByCategoryFilters(data || [], categoryFilters ?? []);
  }

  const { data: recipes } = await supabase
    .from("recipes")
    .select(selectFields)
    .eq("is_public", true)
    .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
    .limit(20);

  const { data: tagMatches } = await supabase
    .from("recipe_tags")
    .select("recipe_id")
    .ilike("tag", `%${trimmed}%`);

  const { data: byIngredient } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id")
    .ilike("name", `%${trimmed}%`);

  const extraIds = [
    ...(tagMatches?.map((t) => t.recipe_id) ?? []),
    ...(byIngredient?.map((i) => i.recipe_id) ?? []),
  ];

  let extraRecipes: typeof recipes = [];
  if (extraIds.length) {
    const { data } = await supabase
      .from("recipes")
      .select(selectFields)
      .eq("is_public", true)
      .in("id", [...new Set(extraIds)]);
    extraRecipes = data || [];
  }

  const combined = [...(recipes || []), ...extraRecipes];
  const unique = Array.from(new Map(combined.map((r) => [r.id, r])).values());

  return filterByCategoryFilters(unique, categoryFilters ?? []);
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
      "recipe:recipes(*, category:recipe_categories(*), custom_category:custom_categories(*), tags:recipe_tags(*))"
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

  const userCategories = await getUserCategories();
  return applyUserCategoryDisplayNames(recipes, userCategories);
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
