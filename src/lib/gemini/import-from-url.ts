import { getGeminiModel, parseGeminiJson } from "@/lib/gemini/client";
import {
  GEMINI_TEXT_PROMPT_PREFIX,
} from "@/lib/gemini/prompts";
import { extractRecipeTextForGemini } from "@/lib/gemini/recipe-html-text";
import { normalizeRecipeExtraction } from "@/lib/recipe-extraction-utils";
import type { GeminiRecipeExtraction } from "@/types/database";

export async function fetchAndParseRecipeUrl(
  url: string
): Promise<GeminiRecipeExtraction> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Ungültiger Link");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Nur HTTP/HTTPS-URLs erlaubt");
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; MeineRezepte/1.0; +https://rezepte-alpha.vercel.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Seite konnte nicht geladen werden (${response.status})`);
  }

  const html = await response.text();
  const text = extractRecipeTextForGemini(html);

  if (text.length < 100) {
    throw new Error("Zu wenig Rezepttext auf der Seite gefunden");
  }

  const model = getGeminiModel();
  const result = await model.generateContent(GEMINI_TEXT_PROMPT_PREFIX + text);
  const parsed = parseGeminiJson<GeminiRecipeExtraction>(result.response.text());
  return normalizeRecipeExtraction(parsed, text);
}
