import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/recipe-utils";
import { getSelectableDays } from "@/lib/shopping-utils";
import { format, parseISO } from "date-fns";
import type { ShoppingList, ShoppingListItem } from "@/types/database";

export type ShoppingListWithItems = ShoppingList & {
  items: ShoppingListItem[];
};

const LIST_META = {
  plan: { listType: "plan" as const, title: "Zutaten – Wochenplan" },
  extras: { listType: "extras" as const, title: "Weitere Zutaten" },
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function listTypeColumnMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    msg.includes("list_type")
  );
}

function normalizeList(raw: ShoppingList & { items?: ShoppingListItem[] | null }): ShoppingListWithItems {
  return {
    ...raw,
    items: raw.items ?? [],
  };
}

async function fetchTypedLists(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, items:shopping_list_items(*)")
    .eq("user_id", userId)
    .in("list_type", ["plan", "extras"]);

  if (error && listTypeColumnMissing(error)) {
    return { lists: [] as ShoppingListWithItems[], typedSupported: false };
  }
  if (error) throw new Error(error.message);

  return {
    lists: (data ?? []).map(normalizeList),
    typedSupported: true,
  };
}

async function fetchListsByTitle(supabase: SupabaseClient, userId: string) {
  const titles = Object.values(LIST_META).map((m) => m.title);
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*, items:shopping_list_items(*)")
    .eq("user_id", userId)
    .in("title", titles);

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeList);
}

async function createList(
  supabase: SupabaseClient,
  userId: string,
  key: keyof typeof LIST_META,
  typedSupported: boolean
): Promise<ShoppingListWithItems> {
  const meta = LIST_META[key];
  const payload: { user_id: string; title: string; list_type?: string } = {
    user_id: userId,
    title: meta.title,
  };
  if (typedSupported) payload.list_type = meta.listType;

  const { data, error } = await supabase
    .from("shopping_lists")
    .insert(payload)
    .select("*, items:shopping_list_items(*)")
    .single();

  if (error && typedSupported && listTypeColumnMissing(error)) {
    return createList(supabase, userId, key, false);
  }
  if (error) throw new Error(error.message);

  return normalizeList(data);
}

export async function ensureShoppingLists(
  supabase: SupabaseClient,
  userId: string
): Promise<{ planList: ShoppingListWithItems; extrasList: ShoppingListWithItems }> {
  const { lists: initialLists, typedSupported } = await fetchTypedLists(
    supabase,
    userId
  );
  const lists = typedSupported
    ? initialLists
    : await fetchListsByTitle(supabase, userId);

  const findList = (key: keyof typeof LIST_META) => {
    const meta = LIST_META[key];
    return lists.find((list) =>
      typedSupported ? list.list_type === meta.listType : list.title === meta.title
    );
  };

  let planList = findList("plan");
  let extrasList = findList("extras");

  if (!planList) {
    planList = await createList(supabase, userId, "plan", typedSupported);
  }
  if (!extrasList) {
    extrasList = await createList(supabase, userId, "extras", typedSupported);
  }

  return { planList, extrasList };
}

export async function getShoppingListPageData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { planList, extrasList } = await ensureShoppingLists(supabase, user.id);

  const selectableDays = getSelectableDays();
  const weekStarts = [
    ...new Set(
      selectableDays.map((d) =>
        format(getWeekStart(parseISO(d.date)), "yyyy-MM-dd")
      )
    ),
  ];

  const { data: mealPlans } = await supabase
    .from("meal_plans")
    .select("id, week_start")
    .eq("user_id", user.id)
    .in("week_start", weekStarts);

  const planIds = mealPlans?.map((p) => p.id) ?? [];
  const planWeekStarts: Record<string, string> = {};
  for (const plan of mealPlans ?? []) {
    planWeekStarts[plan.id] = plan.week_start;
  }

  let planEntries: { meal_plan_id: string; day_of_week: number }[] = [];

  if (planIds.length > 0) {
    const { data: entries } = await supabase
      .from("meal_plan_entries")
      .select("meal_plan_id, day_of_week")
      .in("meal_plan_id", planIds);

    planEntries = entries ?? [];
  }

  return {
    planList,
    extrasList,
    planEntries,
    planWeekStarts,
  };
}
