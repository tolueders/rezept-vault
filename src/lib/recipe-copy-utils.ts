import type { RecipeFormValues } from "@/lib/validations/auth";
import type { RecipeWithDetails } from "@/types/database";

export const UNCHANGED_COPY_PUBLISH_MESSAGE =
  "Übernommene Rezepte können erst veröffentlicht werden, wenn du sie verändert hast.";

export interface RecipeContentSnapshot {
  title: string;
  description: string;
  image_url: string | null;
  category_id: string | null;
  custom_category_id: string | null;
  servings: number;
  cook_time_minutes: number;
  difficulty: string;
  tags: string[];
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  steps: string[];
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function normalizeAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "de")
  );
}

function normalizeIngredients(
  ingredients: Array<{ name: string; amount: number; unit: string }>
): Array<{ name: string; amount: number; unit: string }> {
  return ingredients
    .map((ingredient) => ({
      name: ingredient.name.trim(),
      amount: normalizeAmount(Number(ingredient.amount) || 0),
      unit: ingredient.unit.trim(),
    }))
    .filter((ingredient) => ingredient.name.length > 0);
}

function normalizeSteps(steps: string[]): string[] {
  return steps.map((step) => step.trim()).filter(Boolean);
}

export function recipeWithDetailsToSnapshot(
  recipe: RecipeWithDetails,
  imageUrl?: string | null
): RecipeContentSnapshot {
  return {
    title: normalizeText(recipe.title),
    description: normalizeText(recipe.description),
    image_url: imageUrl !== undefined ? imageUrl : recipe.image_url,
    category_id: recipe.category_id,
    custom_category_id: recipe.custom_category_id,
    servings: Math.max(1, Number(recipe.servings) || 1),
    cook_time_minutes: Math.max(0, Number(recipe.cook_time_minutes) || 0),
    difficulty: recipe.difficulty,
    tags: normalizeTags(recipe.tags.map((tag) => tag.tag)),
    ingredients: normalizeIngredients(
      recipe.ingredients.map((ingredient) => ({
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
      }))
    ),
    steps: normalizeSteps(recipe.steps.map((step) => step.instruction)),
  };
}

export function formValuesToSnapshot(
  data: RecipeFormValues,
  imageUrl?: string | null
): RecipeContentSnapshot {
  return {
    title: normalizeText(data.title),
    description: normalizeText(data.description),
    image_url: imageUrl ?? null,
    category_id: data.category_id || null,
    custom_category_id: data.custom_category_id || null,
    servings: Math.max(1, Number(data.servings) || 1),
    cook_time_minutes: Math.max(0, Number(data.cook_time_minutes) || 0),
    difficulty: data.difficulty,
    tags: normalizeTags(data.tags),
    ingredients: normalizeIngredients(data.ingredients),
    steps: normalizeSteps(data.steps.map((step) => step.instruction)),
  };
}

export function snapshotsEqual(
  left: RecipeContentSnapshot,
  right: RecipeContentSnapshot
): boolean {
  if (
    left.title !== right.title ||
    left.description !== right.description ||
    left.image_url !== right.image_url ||
    left.category_id !== right.category_id ||
    left.custom_category_id !== right.custom_category_id ||
    left.servings !== right.servings ||
    left.cook_time_minutes !== right.cook_time_minutes ||
    left.difficulty !== right.difficulty
  ) {
    return false;
  }

  if (left.tags.length !== right.tags.length) return false;
  for (let i = 0; i < left.tags.length; i += 1) {
    if (left.tags[i] !== right.tags[i]) return false;
  }

  if (left.ingredients.length !== right.ingredients.length) return false;
  for (let i = 0; i < left.ingredients.length; i += 1) {
    const a = left.ingredients[i];
    const b = right.ingredients[i];
    if (a.name !== b.name || a.amount !== b.amount || a.unit !== b.unit) {
      return false;
    }
  }

  if (left.steps.length !== right.steps.length) return false;
  for (let i = 0; i < left.steps.length; i += 1) {
    if (left.steps[i] !== right.steps[i]) return false;
  }

  return true;
}
