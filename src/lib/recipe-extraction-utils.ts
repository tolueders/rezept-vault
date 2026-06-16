import type { DifficultyLevel, GeminiRecipeExtraction } from "@/types/database";

const DIFFICULTIES: DifficultyLevel[] = ["einfach", "mittel", "schwer"];

const SERVINGS_PATTERNS: RegExp[] = [
  /(?:für|fur|ergibt|reicht\s+für|ca\.?\s*|etwa\s+|mind\.?\s+|max\.?\s+)(\d+)\s*(?:personen|portionen|portions|pers\.?|p\.?|gäste|gaeste)/gi,
  /(\d+)\s*(?:personen|portionen|portions|pers\.?|p\.?|gäste|gaeste)/gi,
  /(\d+)\s*(?:stück|stuecke|stck\.?|slices?|pieces?)/gi,
  /(?:serves|yield[s]?)\s+(\d+)/gi,
];

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

/** Liest eine Portionenzahl aus Zahlen, Strings oder Bereichen (z. B. „4–6“). */
export function parseServingsValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.min(99, Math.round(value));
  }

  const text = String(value).trim();
  if (!text) return null;

  const rangeMatch = text.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[2]);
    if (low > 0 && high > 0) {
      return Math.min(99, Math.round((low + high) / 2));
    }
  }

  const numberMatch = text.match(/\d+/);
  if (numberMatch) {
    const parsed = Number(numberMatch[0]);
    if (parsed > 0 && parsed <= 99) return parsed;
  }

  return null;
}

/** Sucht Portionen in Titel, Beschreibung, Zutatenblock oder Quelltext. */
export function inferServingsFromText(...sources: (string | undefined)[]): number | null {
  for (const source of sources) {
    if (!source?.trim()) continue;

    const rangeMatch = source.match(
      /(\d+)\s*[-–—]\s*(\d+)\s*(?:personen|portionen|portions|pers\.?|p\.?|stück|stuecke|stck\.?)/i
    );
    if (rangeMatch) {
      const low = Number(rangeMatch[1]);
      const high = Number(rangeMatch[2]);
      if (low > 0 && high > 0) {
        return Math.min(99, Math.round((low + high) / 2));
      }
    }

    for (const pattern of SERVINGS_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(source)) !== null) {
        const parsed = Number(match[1]);
        if (parsed > 0 && parsed <= 99) return parsed;
      }
    }
  }

  return null;
}

export function resolveRecipeServings(
  data: Partial<GeminiRecipeExtraction>,
  contextText?: string
): number {
  const fromField = parseServingsValue(data.servings);
  if (fromField !== null) return fromField;

  const ingredientText = (data.ingredients ?? [])
    .map((ingredient) => String(ingredient.name ?? "").trim())
    .filter(Boolean)
    .join("\n");

  const inferred = inferServingsFromText(
    data.title,
    data.description,
    ingredientText,
    contextText
  );
  if (inferred !== null) return inferred;

  return 1;
}

export function normalizeRecipeExtraction(
  data: Partial<GeminiRecipeExtraction>,
  contextText?: string
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
    servings: resolveRecipeServings(data, contextText),
    cook_time_minutes: Math.max(0, toNumber(data.cook_time_minutes, 30)),
    difficulty: normalizeDifficulty(data.difficulty),
    ingredients: ingredients.length > 0 ? ingredients : [{ name: "", amount: 0, unit: "" }],
    steps: steps.length > 0 ? steps : [{ instruction: "" }],
  };
}
