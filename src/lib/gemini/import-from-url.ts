import { GoogleGenerativeAI } from "@google/generative-ai";
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ist nicht konfiguriert");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Ungültige URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Nur HTTP/HTTPS-URLs erlaubt");
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RezeptVault/1.0; +https://rezepte-alpha.vercel.app)",
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

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(URL_EXTRACTION_PROMPT + text);
  const raw = result.response.text();
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as GeminiRecipeExtraction;

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
