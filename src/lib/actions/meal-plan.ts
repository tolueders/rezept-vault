"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeekStart, mergeShoppingIngredients } from "@/lib/recipe-utils";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

export async function getOrCreateMealPlan(weekStart?: Date) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { error } = await supabase.from("meal_plan_entries").insert({
    meal_plan_id: mealPlanId,
    day_of_week: dayOfWeek,
    recipe_id: recipeId,
    meal_type: mealType,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/meal-plan");
}

export async function removeMealPlanEntry(entryId: string) {
  const supabase = await createClient();
  await supabase.from("meal_plan_entries").delete().eq("id", entryId);
  revalidatePath("/meal-plan");
}

export async function generateShoppingList(mealPlanId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

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

  if (merged.length > 0) {
    await supabase.from("shopping_list_items").insert(
      merged.map((item, i) => ({
        shopping_list_id: list.id,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/shopping-list");
  return list;
}

export async function toggleShoppingItem(itemId: string, checked: boolean) {
  const supabase = await createClient();
  await supabase
    .from("shopping_list_items")
    .update({ checked })
    .eq("id", itemId);
  revalidatePath("/shopping-list");
}

export async function deleteShoppingList(listId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", user.id);
  revalidatePath("/shopping-list");
}
