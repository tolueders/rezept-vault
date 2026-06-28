"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/recipe-utils";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");
  return { supabase, user };
}

function revalidateCategoryPaths() {
  revalidatePath("/profile");
  revalidatePath("/recipes");
  revalidatePath("/favorites");
  revalidatePath("/discover");
}

export async function createCustomCategory(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error("Name muss mindestens 2 Zeichen haben");

  const { supabase, user } = await requireUser();
  const slug = generateSlug(trimmed);

  const { data, error } = await supabase
    .from("custom_categories")
    .insert({ user_id: user.id, name: trimmed, slug })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Kategorie existiert bereits");
    throw new Error(error.message);
  }

  revalidateCategoryPaths();
  return data;
}

export async function updateCustomCategory(id: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error("Name muss mindestens 2 Zeichen haben");

  const { supabase, user } = await requireUser();
  const slug = generateSlug(trimmed);

  const { error } = await supabase
    .from("custom_categories")
    .update({ name: trimmed, slug })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") throw new Error("Kategorie existiert bereits");
    throw new Error(error.message);
  }

  revalidateCategoryPaths();
}

export async function upsertStandardCategoryOverride(
  recipeCategoryId: string,
  name: string
) {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error("Name muss mindestens 2 Zeichen haben");

  const { supabase, user } = await requireUser();

  const { data: standard, error: standardError } = await supabase
    .from("recipe_categories")
    .select("name")
    .eq("id", recipeCategoryId)
    .single();

  if (standardError || !standard) throw new Error("Kategorie nicht gefunden");

  if (standard.name === trimmed) {
    await supabase
      .from("user_category_overrides")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_category_id", recipeCategoryId);
    revalidateCategoryPaths();
    return;
  }

  const { error } = await supabase.from("user_category_overrides").upsert(
    {
      user_id: user.id,
      recipe_category_id: recipeCategoryId,
      name: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,recipe_category_id" }
  );

  if (error) throw new Error(error.message);
  revalidateCategoryPaths();
}

export async function migrateRecipesToCategory(
  fromCustomCategoryId: string,
  targetFilterKey: string
) {
  const { supabase, user } = await requireUser();

  if (targetFilterKey.startsWith("std:")) {
    const categoryId = targetFilterKey.slice(4);
    const { error } = await supabase
      .from("recipes")
      .update({ category_id: categoryId, custom_category_id: null })
      .eq("custom_category_id", fromCustomCategoryId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return;
  }

  if (targetFilterKey.startsWith("custom:")) {
    const customCategoryId = targetFilterKey.slice(7);
    if (customCategoryId === fromCustomCategoryId) {
      throw new Error("Ziel-Kategorie muss eine andere sein");
    }

    const { error } = await supabase
      .from("recipes")
      .update({ category_id: null, custom_category_id: customCategoryId })
      .eq("custom_category_id", fromCustomCategoryId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return;
  }

  throw new Error("Ungültige Ziel-Kategorie");
}

export async function deleteCustomCategory(
  id: string,
  targetFilterKey?: string
) {
  const { supabase, user } = await requireUser();

  const { count, error: countError } = await supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("custom_category_id", id)
    .eq("user_id", user.id);

  if (countError) throw new Error(countError.message);

  if ((count ?? 0) > 0) {
    if (!targetFilterKey) {
      throw new Error("Bitte eine Ziel-Kategorie für bestehende Rezepte wählen");
    }
    await migrateRecipesToCategory(id, targetFilterKey);
  }

  const { error } = await supabase
    .from("custom_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidateCategoryPaths();
}

export async function migrateStandardCategoryRecipes(
  fromStandardCategoryId: string,
  targetFilterKey: string
) {
  const { supabase, user } = await requireUser();

  if (targetFilterKey.startsWith("std:")) {
    const categoryId = targetFilterKey.slice(4);
    if (categoryId === fromStandardCategoryId) {
      throw new Error("Ziel-Kategorie muss eine andere sein");
    }

    const { error } = await supabase
      .from("recipes")
      .update({ category_id: categoryId, custom_category_id: null })
      .eq("category_id", fromStandardCategoryId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return;
  }

  if (targetFilterKey.startsWith("custom:")) {
    const customCategoryId = targetFilterKey.slice(7);

    const { error } = await supabase
      .from("recipes")
      .update({ category_id: null, custom_category_id: customCategoryId })
      .eq("category_id", fromStandardCategoryId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    return;
  }

  throw new Error("Ungültige Ziel-Kategorie");
}

export async function resetStandardCategoryOverride(recipeCategoryId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("user_category_overrides")
    .delete()
    .eq("user_id", user.id)
    .eq("recipe_category_id", recipeCategoryId);

  if (error) throw new Error(error.message);
  revalidateCategoryPaths();
}
