"use server";

import { createClient } from "@/lib/supabase/server";
import type { PdfExportRecipe } from "@/types/pdf-export";

export async function getRecipesForPdfExport(): Promise<PdfExportRecipe[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht autorisiert");
  }

  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      id,
      title,
      description,
      servings,
      cook_time_minutes,
      difficulty,
      average_rating,
      created_at,
      category:recipe_categories(name),
      custom_category:custom_categories(name),
      tags:recipe_tags(tag),
      ingredients:recipe_ingredients(name, amount, unit, sort_order),
      steps:recipe_steps(instruction, sort_order),
      comments:recipe_comments(content, created_at),
      ratings:recipe_ratings(rating)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((recipe) => {
    const category = Array.isArray(recipe.category)
      ? recipe.category[0]
      : recipe.category;
    const customCategory = Array.isArray(recipe.custom_category)
      ? recipe.custom_category[0]
      : recipe.custom_category;

    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      cook_time_minutes: recipe.cook_time_minutes,
      difficulty: recipe.difficulty,
      average_rating: recipe.average_rating ?? 0,
      category: category ? { name: category.name } : null,
      custom_category: customCategory ? { name: customCategory.name } : null,
      tags: recipe.tags ?? [],
      comments: recipe.comments ?? [],
      ratings: recipe.ratings ?? [],
      ingredients: [...(recipe.ingredients ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
      steps: [...(recipe.steps ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    } satisfies PdfExportRecipe;
  });
}
