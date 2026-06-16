import { addDays, format, parseISO, startOfDay } from "date-fns";
import { de } from "date-fns/locale";

export type ShoppingListType = "general" | "plan" | "extras";

export interface SelectableDay {
  date: string;
  label: string;
  weekday: string;
  isToday: boolean;
}

export function getSelectableDays(from = new Date()): SelectableDay[] {
  const today = startOfDay(from);
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    return {
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "d.", { locale: de }),
      weekday: format(day, "EEE", { locale: de }),
      isToday: i === 0,
    };
  });
}

export function entryDateFromPlan(weekStart: string, dayOfWeek: number): Date {
  return addDays(parseISO(weekStart), dayOfWeek);
}

export function itemKey(name: string, unit: string): string {
  return `${name.toLowerCase().trim()}|${unit.toLowerCase().trim()}`;
}

export interface ShopSourceItem {
  listId: string;
  itemId: string;
  checked: boolean;
  amount: number;
}

export interface MergedShopItem {
  key: string;
  name: string;
  amount: number;
  unit: string;
  sources: ShopSourceItem[];
}

export function mergeItemsForShop(
  items: {
    id: string;
    shopping_list_id: string;
    name: string;
    amount: number;
    unit: string;
    checked: boolean;
  }[]
): MergedShopItem[] {
  const map = new Map<string, MergedShopItem>();

  for (const item of items) {
    const key = itemKey(item.name, item.unit);
    const existing = map.get(key);
    const source: ShopSourceItem = {
      listId: item.shopping_list_id,
      itemId: item.id,
      checked: item.checked,
      amount: item.amount,
    };

    if (existing) {
      existing.amount += item.amount;
      existing.sources.push(source);
    } else {
      map.set(key, {
        key,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        sources: [source],
      });
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export function isMergedItemChecked(item: MergedShopItem): boolean {
  return item.sources.length > 0 && item.sources.every((s) => s.checked);
}

export function countPlannedRecipesOnDates(
  entries: { day_of_week: number; meal_plan_id: string }[],
  planWeekStarts: Map<string, string>,
  selectedDates: Set<string>
): number {
  let count = 0;
  for (const entry of entries) {
    const weekStart = planWeekStarts.get(entry.meal_plan_id);
    if (!weekStart) continue;
    const dateStr = format(entryDateFromPlan(weekStart, entry.day_of_week), "yyyy-MM-dd");
    if (selectedDates.has(dateStr)) count += 1;
  }
  return count;
}
