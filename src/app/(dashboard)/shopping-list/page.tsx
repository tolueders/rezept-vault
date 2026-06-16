import { createClient } from "@/lib/supabase/server";
import { ShoppingListView } from "@/components/shopping/shopping-list-view";
import { ensureTypedShoppingLists } from "@/lib/actions/meal-plan";
import { getWeekStart } from "@/lib/recipe-utils";
import { getSelectableDays } from "@/lib/shopping-utils";
import { format, parseISO } from "date-fns";

export const metadata = { title: "Einkaufsliste" };

export default async function ShoppingListPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await ensureTypedShoppingLists();

  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("*, items:shopping_list_items(*)")
    .eq("user_id", user!.id)
    .in("list_type", ["plan", "extras"]);

  const planList =
    lists?.find((l) => l.list_type === "plan") ?? null;
  const extrasList =
    lists?.find((l) => l.list_type === "extras") ?? null;

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
    .eq("user_id", user!.id)
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

  return (
    <ShoppingListView
      planList={planList}
      extrasList={extrasList}
      planEntries={planEntries}
      planWeekStarts={planWeekStarts}
      shopMode={params.mode === "shop"}
    />
  );
}
