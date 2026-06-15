import { createClient } from "@/lib/supabase/server";
import { getOrCreateMealPlan } from "@/lib/actions/meal-plan";
import { MealPlanView } from "@/components/meal-plan/meal-plan-view";
import { getWeekStart } from "@/lib/recipe-utils";
import { format, parseISO } from "date-fns";

export const metadata = { title: "Wochenplanung" };

export default async function MealPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const weekStart = params.week
    ? parseISO(params.week)
    : getWeekStart();

  const mealPlan = await getOrCreateMealPlan(weekStart);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: entries }, { data: userRecipes }] = await Promise.all([
    supabase
      .from("meal_plan_entries")
      .select("*, recipe:recipes(*)")
      .eq("meal_plan_id", mealPlan.id)
      .order("sort_order"),
    supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user!.id)
      .order("title"),
  ]);

  return (
    <MealPlanView
      mealPlanId={mealPlan.id}
      weekStart={format(weekStart, "yyyy-MM-dd")}
      entries={entries || []}
      userRecipes={userRecipes || []}
    />
  );
}
