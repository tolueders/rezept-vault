"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/recipe-utils";
import type { RecipeFormValues } from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";

export async function createRecipe(
  data: RecipeFormValues,
  imageUrl?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const slug = generateSlug(data.title) + "-" + Date.now().toString(36);

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: data.title,
      slug,
      description: data.description || "",
      image_url: imageUrl || null,
      category_id: data.category_id || null,
      custom_category_id: data.custom_category_id || null,
      servings: data.servings,
      cook_time_minutes: data.cook_time_minutes,
      difficulty: data.difficulty,
      is_public: data.is_public,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (data.tags.length > 0) {
    await supabase.from("recipe_tags").insert(
      data.tags.map((tag) => ({ recipe_id: recipe.id, tag: tag.trim() }))
    );
  }

  if (data.ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      data.ingredients.map((ing, i) => ({
        recipe_id: recipe.id,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        sort_order: i,
      }))
    );
  }

  if (data.steps.length > 0) {
    await supabase.from("recipe_steps").insert(
      data.steps.map((step, i) => ({
        recipe_id: recipe.id,
        instruction: step.instruction,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/recipes");
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

  const updateData: Record<string, unknown> = {
    title: data.title,
    description: data.description || "",
    category_id: data.category_id || null,
    custom_category_id: data.custom_category_id || null,
    servings: data.servings,
    cook_time_minutes: data.cook_time_minutes,
    difficulty: data.difficulty,
    is_public: data.is_public,
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

  if (data.tags.length > 0) {
    await supabase.from("recipe_tags").insert(
      data.tags.map((tag) => ({ recipe_id: id, tag: tag.trim() }))
    );
  }

  await supabase.from("recipe_ingredients").insert(
    data.ingredients.map((ing, i) => ({
      recipe_id: id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      sort_order: i,
    }))
  );

  await supabase.from("recipe_steps").insert(
    data.steps.map((step, i) => ({
      recipe_id: id,
      instruction: step.instruction,
      sort_order: i,
    }))
  );

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { success: true };
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/recipes");
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
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/recipe`);
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

  const slug =
    generateSlug(variantName) + "-variant-" + Date.now().toString(36);

  const { data: variant, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: variantName,
      slug,
      description: data.description || "",
      image_url: imageUrl || null,
      category_id: data.category_id || null,
      servings: data.servings,
      cook_time_minutes: data.cook_time_minutes,
      difficulty: data.difficulty,
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

  if (data.tags.length > 0) {
    await supabase.from("recipe_tags").insert(
      data.tags.map((tag) => ({ recipe_id: variant.id, tag: tag.trim() }))
    );
  }
  await supabase.from("recipe_ingredients").insert(
    data.ingredients.map((ing, i) => ({
      recipe_id: variant.id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      sort_order: i,
    }))
  );
  await supabase.from("recipe_steps").insert(
    data.steps.map((step, i) => ({
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
