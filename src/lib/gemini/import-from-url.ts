import { getGeminiModel, parseGeminiJson } from "@/lib/gemini/client";
import { normalizeRecipeExtraction } from "@/lib/recipe-extraction-utils";
import type { GeminiRecipeExtraction } from "@/types/database";

const URL_EXTRACTION_PROMPT = `Analysiere den folgenden Rezepttext von einer Webseite und extrahiere alle Informationen als JSON.
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

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

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
  const text = stripHtml(html);

  if (text.length < 100) {
    throw new Error("Zu wenig Rezepttext auf der Seite gefunden");
  }

  const model = getGeminiModel();
  const result = await model.generateContent(URL_EXTRACTION_PROMPT + text);
  const parsed = parseGeminiJson<GeminiRecipeExtraction>(result.response.text());
  return normalizeRecipeExtraction(parsed);
}
