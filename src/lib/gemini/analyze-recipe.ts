import { getGeminiModel, parseGeminiJson } from "@/lib/gemini/client";
import type { GeminiRecipeExtraction } from "@/types/database";

const EXTRACTION_PROMPT = `Analysiere dieses Rezeptbild und extrahiere alle Informationen als JSON.
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
Wenn Mengen nicht erkennbar sind, schätze sinnvoll. Sprache: Deutsch.`;

export async function analyzeRecipeImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiRecipeExtraction> {
  const model = getGeminiModel();

  const result = await model.generateContent([
    EXTRACTION_PROMPT,
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
  ]);

  const parsed = parseGeminiJson<GeminiRecipeExtraction>(result.response.text());

  return {
    title: parsed.title || "Unbenanntes Rezept",
    description: parsed.description || "",
    servings: parsed.servings || 4,
    cook_time_minutes: parsed.cook_time_minutes || 30,
    difficulty: parsed.difficulty || "mittel",
    ingredients: parsed.ingredients || [],
    steps: parsed.steps || [],
  };
}
