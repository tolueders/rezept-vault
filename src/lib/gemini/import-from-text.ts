import { getGeminiModel, parseGeminiJson } from "@/lib/gemini/client";
import { normalizeRecipeExtraction } from "@/lib/recipe-extraction-utils";
import type { GeminiRecipeExtraction } from "@/types/database";

const TEXT_EXTRACTION_PROMPT = `Analysiere den folgenden Rezepttext und extrahiere alle Informationen als JSON.
Antworte NUR mit validem JSON ohne Markdown-Codeblöcke.
Schema:
{
  "title": "Rezepttitel",
  "description": "Kurze Beschreibung optional",
  "servings": 4,
  "cook_time_minutes": 30,
  "difficulty": "einfach" | "mittel" | "schwer",
  "ingredients": [{ "name": "Zutat", "amount": 100, "unit": "g" }],
  "steps": [{ "instruction": "Schrittbeschreibung" }]
}
Wenn Mengen nicht erkennbar sind, schätze sinnvoll. Sprache: Deutsch.

Rezepttext:
`;

export async function parseRecipeText(
  text: string
): Promise<GeminiRecipeExtraction> {
  const trimmed = text.trim().slice(0, 12000);

  if (trimmed.length < 20) {
    throw new Error("Text ist zu kurz. Bitte ein vollständiges Rezept einfügen.");
  }

  const model = getGeminiModel();
  const result = await model.generateContent(TEXT_EXTRACTION_PROMPT + trimmed);
  const parsed = parseGeminiJson<GeminiRecipeExtraction>(result.response.text());
  return normalizeRecipeExtraction(parsed);
}
