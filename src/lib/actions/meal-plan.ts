"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeekStart, mergeShoppingIngredients } from "@/lib/recipe-utils";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");
  return { supabase, user };
}

export async function getOrCreateMealPlan(weekStart?: Date) {
  const { supabase, user } = await requireUser();

  const start = weekStart || getWeekStart();
  const weekStartStr = format(start, "yyyy-MM-dd");

  const { data: existing } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", weekStartStr)
    .maybeSingle();

  if (existing) return existing;

  const { data: plan, error } = await supabase
    .from("meal_plans")
    .insert({ user_id: user.id, week_start: weekStartStr })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return plan;
}

export async function addMealPlanEntry(
  mealPlanId: string,
  dayOfWeek: number,
  recipeId: string,
  mealType: string = "abendessen"
) {
  const { supabase, user } = await requireUser();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", mealPlanId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) throw new Error("Wochenplan nicht gefunden");

  const { error } = await supabase.from("meal_plan_entries").insert({
    meal_plan_id: mealPlanId,
    day_of_week: dayOfWeek,
    recipe_id: recipeId,
    meal_type: mealType,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/meal-plan");
}

export async function addRecipeToMealPlan({
  recipeId,
  dayOfWeek,
  mealType,
  weekStart,
}: {
  recipeId: string;
  dayOfWeek: number;
  mealType: string;
  weekStart: string;
}) {
  const { supabase, user } = await requireUser();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("id", recipeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!recipe) throw new Error("Rezept nicht gefunden");

  const { data: existingPlan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  let mealPlanId = existingPlan?.id;

  if (!mealPlanId) {
    const { data: plan, error } = await supabase
      .from("meal_plans")
      .insert({ user_id: user.id, week_start: weekStart })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    mealPlanId = plan.id;
  }

  await addMealPlanEntry(mealPlanId, dayOfWeek, recipeId, mealType);
  revalidatePath("/meal-plan");
}

export async function removeMealPlanEntry(entryId: string) {
  const { supabase, user } = await requireUser();

  const { data: entry } = await supabase
    .from("meal_plan_entries")
    .select("meal_plan_id")
    .eq("id", entryId)
    .maybeSingle();

  if (!entry) throw new Error("Eintrag nicht gefunden");

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", entry.meal_plan_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) throw new Error("Eintrag nicht gefunden");

  await supabase.from("meal_plan_entries").delete().eq("id", entryId);
  revalidatePath("/meal-plan");
}

export async function generateShoppingList(mealPlanId: string) {
  const { supabase, user } = await requireUser();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", mealPlanId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plan) throw new Error("Wochenplan nicht gefunden");

  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", mealPlanId);

  if (!entries?.length) throw new Error("Keine Rezepte im Wochenplan");

  const recipeIds = entries.map((e) => e.recipe_id);
  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("name, amount, unit")
    .in("recipe_id", recipeIds);

  const merged = mergeShoppingIngredients(ingredients || []);

  const { data: existingList } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", user.id)
    .eq("meal_plan_id", mealPlanId)
    .maybeSingle();

  let listId: string;

  if (existingList) {
    listId = existingList.id;
    await supabase
      .from("shopping_list_items")
      .delete()
      .eq("shopping_list_id", listId);
  } else {
    const { data: list, error: listError } = await supabase
      .from("shopping_lists")
      .insert({
        user_id: user.id,
        meal_plan_id: mealPlanId,
        title: "Einkaufsliste – Wochenplan",
      })
      .select()
      .single();

    if (listError) throw new Error(listError.message);
    listId = list.id;
  }

  if (merged.length > 0) {
    await supabase.from("shopping_list_items").insert(
      merged.map((item, i) => ({
        shopping_list_id: listId,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/shopping-list");
  return { id: listId };
}

export async function createEmptyShoppingList(title = "Meine Einkaufsliste") {
  const { supabase, user } = await requireUser();

  const { data: list, error } = await supabase
    .from("shopping_lists")
    .insert({ user_id: user.id, title })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/shopping-list");
  return list;
}

export async function addShoppingListItem(
  listId: string,
  name: string,
  amount = 1,
  unit = "Stück"
) {
  const { supabase, user } = await requireUser();

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) throw new Error("Liste nicht gefunden");

  const { data: items } = await supabase
    .from("shopping_list_items")
    .select("sort_order")
    .eq("shopping_list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (items?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("shopping_list_items").insert({
    shopping_list_id: listId,
    name: name.trim(),
    amount,
    unit,
    sort_order: nextOrder,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/shopping-list");
}

export async function removeShoppingListItem(itemId: string) {
  const { supabase, user } = await requireUser();

  const { data: item } = await supabase
    .from("shopping_list_items")
    .select("shopping_list_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) throw new Error("Eintrag nicht gefunden");

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", item.shopping_list_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) throw new Error("Eintrag nicht gefunden");

  await supabase.from("shopping_list_items").delete().eq("id", itemId);
  revalidatePath("/shopping-list");
}

export async function toggleShoppingItem(itemId: string, checked: boolean) {
  const { supabase, user } = await requireUser();

  const { data: item } = await supabase
    .from("shopping_list_items")
    .select("shopping_list_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) throw new Error("Eintrag nicht gefunden");

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", item.shopping_list_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) throw new Error("Eintrag nicht gefunden");

  await supabase
    .from("shopping_list_items")
    .update({ checked })
    .eq("id", itemId);
  revalidatePath("/shopping-list");
}

export async function deleteShoppingList(listId: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", user.id);
  revalidatePath("/shopping-list");
}
