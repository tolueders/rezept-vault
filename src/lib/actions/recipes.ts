"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/recipe-utils";
import type { RecipeFormValues } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRecipeFormData(data: RecipeFormValues): RecipeFormValues {
  return {
    ...data,
    servings: Math.max(1, toNumber(data.servings, 1)),
    cook_time_minutes: Math.max(0, toNumber(data.cook_time_minutes, 0)),
    ingredients: data.ingredients.map((ingredient) => ({
      ...ingredient,
      amount: Math.max(0, toNumber(ingredient.amount, 0)),
    })),
  };
}

export async function createRecipe(
  data: RecipeFormValues,
  imageUrl?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const recipeData = normalizeRecipeFormData(data);

  const slug = generateSlug(recipeData.title) + "-" + Date.now().toString(36);

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: recipeData.title,
      slug,
      description: recipeData.description || "",
      image_url: imageUrl || null,
      category_id: recipeData.category_id || null,
      custom_category_id: recipeData.custom_category_id || null,
      servings: recipeData.servings,
      cook_time_minutes: recipeData.cook_time_minutes,
      difficulty: recipeData.difficulty,
      is_public: recipeData.is_public,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (recipeData.tags.length > 0) {
    await supabase.from("recipe_tags").insert(
      recipeData.tags.map((tag) => ({ recipe_id: recipe.id, tag: tag.trim() }))
    );
  }

  if (recipeData.ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      recipeData.ingredients.map((ing, i) => ({
        recipe_id: recipe.id,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        sort_order: i,
      }))
    );
  }

  if (recipeData.steps.length > 0) {
    await supabase.from("recipe_steps").insert(
      recipeData.steps.map((step, i) => ({
        recipe_id: recipe.id,
        instruction: step.instruction,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/recipes");
  revalidatePath("/discover");
  return recipe;
}

export async function updateRecipe(
  id: string,
  data: RecipeFormValues,
  imageUrl?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const recipeData = normalizeRecipeFormData(data);

  const updateData: Record<string, unknown> = {
    title: recipeData.title,
    description: recipeData.description || "",
    category_id: recipeData.category_id || null,
    custom_category_id: recipeData.custom_category_id || null,
    servings: recipeData.servings,
    cook_time_minutes: recipeData.cook_time_minutes,
    difficulty: recipeData.difficulty,
    is_public: recipeData.is_public,
  };

  if (imageUrl !== undefined) {
    updateData.image_url = imageUrl;
  }

  const { error } = await supabase
    .from("recipes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  await supabase.from("recipe_tags").delete().eq("recipe_id", id);
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
  await supabase.from("recipe_steps").delete().eq("recipe_id", id);

  if (recipeData.tags.length > 0) {
    await supabase.from("recipe_tags").insert(
      recipeData.tags.map((tag) => ({ recipe_id: id, tag: tag.trim() }))
    );
  }

  await supabase.from("recipe_ingredients").insert(
    recipeData.ingredients.map((ing, i) => ({
      recipe_id: id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      sort_order: i,
    }))
  );

  await supabase.from("recipe_steps").insert(
    recipeData.steps.map((step, i) => ({
      recipe_id: id,
      instruction: step.instruction,
      sort_order: i,
    }))
  );

  revalidatePath("/recipes");
  revalidatePath("/discover");
  revalidatePath(`/recipes/${id}`);
  return { success: true };
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!recipe) throw new Error("Rezept nicht gefunden");

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
  revalidatePath("/discover");
  revalidatePath("/favorites");
  revalidatePath("/meal-plan");
}

export async function publishRecipe(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { data: recipe, error } = await supabase
    .from("recipes")
    .update({ is_public: true })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("slug")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/recipes");
  revalidatePath("/discover");
  revalidatePath(`/recipes/${id}`);
  if (recipe?.slug) revalidatePath(`/recipe/${recipe.slug}`);

  return { success: true };
}

export async function toggleFavorite(recipeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { data: existing } = await supabase
    .from("recipe_favorites")
    .select("id")
    .eq("recipe_id", recipeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("recipe_favorites").delete().eq("id", existing.id);
    revalidatePath("/favorites");
    return { favorited: false };
  }

  await supabase.from("recipe_favorites").insert({
    recipe_id: recipeId,
    user_id: user.id,
  });
  revalidatePath("/favorites");
  return { favorited: true };
}

export async function rateRecipe(recipeId: string, rating: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { error } = await supabase.from("recipe_ratings").upsert(
    { recipe_id: recipeId, user_id: user.id, rating },
    { onConflict: "recipe_id,user_id" }
  );

  if (error) throw new Error(error.message);

  const { data: recipe } = await supabase
    .from("recipes")
    .select("slug")
    .eq("id", recipeId)
    .maybeSingle();

  revalidatePath(`/recipes/${recipeId}`);
  if (recipe?.slug) revalidatePath(`/recipe/${recipe.slug}`);
}

export async function addComment(recipeId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { error } = await supabase.from("recipe_comments").insert({
    recipe_id: recipeId,
    user_id: user.id,
    content,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/recipes/${recipeId}`);
}

export async function updateComment(commentId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { error } = await supabase
    .from("recipe_comments")
    .update({ content })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  await supabase
    .from("recipe_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);
}

export async function copyRecipeToCollection(sourceRecipeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { data: source } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", sourceRecipeId)
    .eq("is_public", true)
    .single();

  if (!source) throw new Error("Rezept nicht gefunden");

  const { data: existingCopy } = await supabase
    .from("recipes")
    .select("id")
    .eq("user_id", user.id)
    .eq("parent_recipe_id", sourceRecipeId)
    .maybeSingle();

  if (existingCopy) return existingCopy;

  const [{ data: tags }, { data: ingredients }, { data: steps }] =
    await Promise.all([
      supabase.from("recipe_tags").select("*").eq("recipe_id", sourceRecipeId),
      supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", sourceRecipeId)
        .order("sort_order"),
      supabase
        .from("recipe_steps")
        .select("*")
        .eq("recipe_id", sourceRecipeId)
        .order("sort_order"),
    ]);

  const slug = generateSlug(source.title) + "-copy-" + Date.now().toString(36);

  const { data: newRecipe, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: source.title,
      slug,
      description: source.description,
      image_url: source.image_url,
      category_id: source.category_id,
      servings: source.servings,
      cook_time_minutes: source.cook_time_minutes,
      difficulty: source.difficulty,
      is_public: false,
      parent_recipe_id: sourceRecipeId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (tags?.length) {
    await supabase.from("recipe_tags").insert(
      tags.map((t) => ({ recipe_id: newRecipe.id, tag: t.tag }))
    );
  }
  if (ingredients?.length) {
    await supabase.from("recipe_ingredients").insert(
      ingredients.map((ing, i) => ({
        recipe_id: newRecipe.id,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        sort_order: i,
      }))
    );
  }
  if (steps?.length) {
    await supabase.from("recipe_steps").insert(
      steps.map((step, i) => ({
        recipe_id: newRecipe.id,
        instruction: step.instruction,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/recipes");
  return newRecipe;
}

export async function createVariant(
  originalRecipeId: string,
  variantName: string,
  data: RecipeFormValues,
  imageUrl?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const recipeData = normalizeRecipeFormData(data);

  const slug =
    generateSlug(variantName) + "-variant-" + Date.now().toString(36);

  const { data: variant, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: variantName,
      slug,
      description: recipeData.description || "",
      image_url: imageUrl || null,
      category_id: recipeData.category_id || null,
      custom_category_id: recipeData.custom_category_id || null,
      servings: recipeData.servings,
      cook_time_minutes: recipeData.cook_time_minutes,
      difficulty: recipeData.difficulty,
      is_public: false,
      original_recipe_id: originalRecipeId,
      is_variant: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("recipe_variants").insert({
    original_recipe_id: originalRecipeId,
    variant_recipe_id: variant.id,
    user_id: user.id,
    variant_name: variantName,
  });

  if (recipeData.tags.length > 0) {
    await supabase.from("recipe_tags").insert(
      recipeData.tags.map((tag) => ({ recipe_id: variant.id, tag: tag.trim() }))
    );
  }
  await supabase.from("recipe_ingredients").insert(
    recipeData.ingredients.map((ing, i) => ({
      recipe_id: variant.id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      sort_order: i,
    }))
  );
  await supabase.from("recipe_steps").insert(
    recipeData.steps.map((step, i) => ({
      recipe_id: variant.id,
      instruction: step.instruction,
      sort_order: i,
    }))
  );

  revalidatePath(`/recipes/${originalRecipeId}`);
  return variant;
}

export async function searchRecipesAction(query: string, categoryId?: string) {
  const { searchRecipes } = await import("@/lib/queries/recipes");
  return searchRecipes(query, categoryId);
}

export async function searchFavoriteRecipesAction(
  query: string,
  categoryId?: string
) {
  const { searchFavoriteRecipes } = await import("@/lib/queries/recipes");
  return searchFavoriteRecipes(query, categoryId);
}

export async function searchPublicRecipesAction(
  query: string,
  categoryId?: string
) {
  const { searchPublicRecipes } = await import("@/lib/queries/recipes");
  return searchPublicRecipes(query, categoryId);
}

export async function setPreferredVariant(variantId: string, originalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  await supabase
    .from("recipe_variants")
    .update({ is_preferred: false })
    .eq("original_recipe_id", originalId)
    .eq("user_id", user.id);

  await supabase
    .from("recipe_variants")
    .update({ is_preferred: true })
    .eq("variant_recipe_id", variantId)
    .eq("user_id", user.id);

  revalidatePath(`/recipes/${originalId}`);
}
