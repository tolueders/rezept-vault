import type { DifficultyLevel, GeminiRecipeExtraction } from "@/types/database";

const DIFFICULTIES: DifficultyLevel[] = ["einfach", "mittel", "schwer"];

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDifficulty(value: unknown): DifficultyLevel {
  return typeof value === "string" &&
    DIFFICULTIES.includes(value as DifficultyLevel)
    ? (value as DifficultyLevel)
    : "mittel";
}

export function normalizeRecipeExtraction(
  data: Partial<GeminiRecipeExtraction>
): GeminiRecipeExtraction {
  const ingredients = (data.ingredients ?? [])
    .map((ingredient) => ({
      name: String(ingredient.name ?? "").trim(),
      amount: Math.max(0, toNumber(ingredient.amount, 0)),
      unit: String(ingredient.unit ?? "").trim(),
    }))
    .filter((ingredient) => ingredient.name.length > 0);

  const steps = (data.steps ?? [])
    .map((step) => ({
      instruction: String(step.instruction ?? "").trim(),
    }))
    .filter((step) => step.instruction.length > 0);

  return {
    title: String(data.title ?? "").trim() || "Unbenanntes Rezept",
    description: String(data.description ?? "").trim(),
    servings: Math.max(1, toNumber(data.servings, 4)),
    cook_time_minutes: Math.max(0, toNumber(data.cook_time_minutes, 30)),
    difficulty: normalizeDifficulty(data.difficulty),
    ingredients: ingredients.length > 0 ? ingredients : [{ name: "", amount: 0, unit: "" }],
    steps: steps.length > 0 ? steps : [{ instruction: "" }],
  };
}
