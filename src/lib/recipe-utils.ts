import slugify from "slugify";
import type { RecipeIngredient } from "@/types/database";

export function generateSlug(title: string): string {
  return slugify(title, { lower: true, strict: true, locale: "de" });
}

export function scaleIngredients(
  ingredients: RecipeIngredient[],
  originalServings: number,
  targetServings: number
): RecipeIngredient[] {
  if (originalServings <= 0 || targetServings <= 0) return ingredients;
  const factor = targetServings / originalServings;
  return ingredients.map((ing) => ({
    ...ing,
    amount: Math.round(ing.amount * factor * 100) / 100,
  }));
}

export function formatAmount(amount: number, unit: string): string {
  const formatted =
    amount % 1 === 0 ? amount.toString() : amount.toFixed(1).replace(/\.0$/, "");
  return unit ? `${formatted} ${unit}` : formatted;
}

export function mergeShoppingIngredients(
  items: { name: string; amount: number; unit: string }[]
): { name: string; amount: number; unit: string }[] {
  const map = new Map<string, { name: string; amount: number; unit: string }>();

  for (const item of items) {
    const key = `${item.name.toLowerCase().trim()}|${item.unit.toLowerCase().trim()}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += item.amount;
    } else {
      map.set(key, { ...item, name: item.name.trim() });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "de")
  );
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${weekStart.toLocaleDateString("de-DE", opts)} – ${weekEnd.toLocaleDateString("de-DE", opts)}`;
}
