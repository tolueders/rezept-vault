"use server";

import { createClient } from "@/lib/supabase/server";
import { getWeekStart, mergeShoppingIngredients } from "@/lib/recipe-utils";
import { entryDateFromPlan } from "@/lib/shopping-utils";
import { ensureShoppingLists } from "@/lib/queries/shopping-lists";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { format, parseISO, startOfDay } from "date-fns";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
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

export async function appendMealPlanIngredientsToList(
  listId: string,
  weekStartStr?: string
) {
  const { supabase, user } = await requireUser();

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) throw new Error("Liste nicht gefunden");

  const start = weekStartStr ? new Date(weekStartStr) : getWeekStart();
  const weekKey = format(getWeekStart(start), "yyyy-MM-dd");

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekKey)
    .maybeSingle();

  if (!plan) throw new Error("Kein Wochenplan für diese Woche");

  const { data: entries } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id")
    .eq("meal_plan_id", plan.id);

  if (!entries?.length) throw new Error("Keine Rezepte im Wochenplan");

  const recipeIds = entries.map((e) => e.recipe_id);
  const { data: planIngredients } = await supabase
    .from("recipe_ingredients")
    .select("name, amount, unit")
    .in("recipe_id", recipeIds);

  if (!planIngredients?.length) {
    throw new Error("Geplante Rezepte haben keine Zutaten");
  }

  const { data: existingItems } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("shopping_list_id", listId)
    .order("sort_order");

  const itemKey = (name: string, unit: string) =>
    `${name.toLowerCase().trim()}|${unit.toLowerCase().trim()}`;

  const existingByKey = new Map(
    (existingItems ?? []).map((item) => [itemKey(item.name, item.unit), item])
  );

  let nextOrder =
    existingItems?.reduce((max, item) => Math.max(max, item.sort_order), -1) ?? -1;

  for (const ing of planIngredients) {
    const key = itemKey(ing.name, ing.unit);
    const existing = existingByKey.get(key);
    if (existing) {
      await supabase
        .from("shopping_list_items")
        .update({ amount: existing.amount + ing.amount })
        .eq("id", existing.id);
      existingByKey.set(key, { ...existing, amount: existing.amount + ing.amount });
    } else {
      nextOrder += 1;
      const { data: inserted } = await supabase
        .from("shopping_list_items")
        .insert({
          shopping_list_id: listId,
          name: ing.name.trim(),
          amount: ing.amount,
          unit: ing.unit,
          sort_order: nextOrder,
        })
        .select()
        .single();
      if (inserted) existingByKey.set(key, inserted);
    }
  }

  revalidatePath("/shopping-list");
  return { added: planIngredients.length };
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

async function getRecipeIdsForDates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dateStrings: string[]
) {
  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
  const validDates = [...new Set(dateStrings.filter((d) => d >= todayStr))];
  if (validDates.length === 0) return [];

  const weekStarts = [
    ...new Set(
      validDates.map((d) => format(getWeekStart(parseISO(d)), "yyyy-MM-dd"))
    ),
  ];

  const { data: plans } = await supabase
    .from("meal_plans")
    .select("id, week_start")
    .eq("user_id", userId)
    .in("week_start", weekStarts);

  if (!plans?.length) return [];

  const validSet = new Set(validDates);
  const recipeIds = new Set<string>();

  for (const plan of plans) {
    const { data: entries } = await supabase
      .from("meal_plan_entries")
      .select("recipe_id, day_of_week")
      .eq("meal_plan_id", plan.id);

    for (const entry of entries ?? []) {
      const entryDate = format(
        entryDateFromPlan(plan.week_start, entry.day_of_week),
        "yyyy-MM-dd"
      );
      if (validSet.has(entryDate)) {
        recipeIds.add(entry.recipe_id);
      }
    }
  }

  return [...recipeIds];
}

export async function ensureTypedShoppingLists() {
  const { supabase, user } = await requireUser();
  await ensureShoppingLists(supabase, user.id);
  revalidatePath("/shopping-list");
}

export async function importPlanIngredientsForDates(dateStrings: string[]) {
  const { supabase, user } = await requireUser();

  const recipeIds = await getRecipeIdsForDates(supabase, user.id, dateStrings);
  if (recipeIds.length === 0) {
    throw new Error("Keine Rezepte für die gewählten Tage geplant");
  }

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("name, amount, unit")
    .in("recipe_id", recipeIds);

  const merged = mergeShoppingIngredients(ingredients || []);

  const { planList } = await ensureShoppingLists(supabase, user.id);

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("shopping_list_id", planList.id);

  if (merged.length > 0) {
    await supabase.from("shopping_list_items").insert(
      merged.map((item, i) => ({
        shopping_list_id: planList.id,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/shopping-list");
  return { count: merged.length, recipes: recipeIds.length };
}

export async function toggleShoppingItems(itemIds: string[], checked: boolean) {
  const { supabase, user } = await requireUser();

  for (const itemId of itemIds) {
    const { data: item } = await supabase
      .from("shopping_list_items")
      .select("shopping_list_id")
      .eq("id", itemId)
      .maybeSingle();

    if (!item) continue;

    const { data: list } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("id", item.shopping_list_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!list) continue;

    await supabase
      .from("shopping_list_items")
      .update({ checked })
      .eq("id", itemId);
  }

  revalidatePath("/shopping-list");
}

export async function finishShoppingTrip(checkedItemIds: string[]) {
  const { supabase, user } = await requireUser();

  let removed = 0;

  for (const itemId of checkedItemIds) {
    const { data: item } = await supabase
      .from("shopping_list_items")
      .select("shopping_list_id")
      .eq("id", itemId)
      .maybeSingle();

    if (!item) continue;

    const { data: list } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("id", item.shopping_list_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!list) continue;

    await supabase.from("shopping_list_items").delete().eq("id", itemId);
    removed += 1;
  }

  revalidatePath("/shopping-list");
  return { removed };
}

export async function clearShoppingList(listId: string) {
  const { supabase, user } = await requireUser();

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) throw new Error("Liste nicht gefunden");

  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("shopping_list_id", listId);
  revalidatePath("/shopping-list");
}
