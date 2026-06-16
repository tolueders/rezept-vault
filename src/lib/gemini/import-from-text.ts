import { getGeminiModel, parseGeminiJson } from "@/lib/gemini/client";
import {
  GEMINI_TEXT_PROMPT_PREFIX,
  MAX_RECIPE_TEXT_LENGTH,
} from "@/lib/gemini/prompts";
import { normalizeRecipeExtraction } from "@/lib/recipe-extraction-utils";
import type { GeminiRecipeExtraction } from "@/types/database";

export async function parseRecipeText(
  text: string
): Promise<GeminiRecipeExtraction> {
  const trimmed = text.trim().slice(0, MAX_RECIPE_TEXT_LENGTH);

  if (trimmed.length < 20) {
    throw new Error("Text ist zu kurz. Bitte ein vollständiges Rezept einfügen.");
  }

  const model = getGeminiModel();
  const result = await model.generateContent(GEMINI_TEXT_PROMPT_PREFIX + trimmed);
  const parsed = parseGeminiJson<GeminiRecipeExtraction>(result.response.text());
  return normalizeRecipeExtraction(parsed);
}
