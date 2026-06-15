import { GoogleGenerativeAI } from "@google/generative-ai";

/** gemini-2.0-flash was shut down 2026-06-01; use a current Flash model. */
export const GEMINI_MODEL = "gemini-2.5-flash";

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ist nicht konfiguriert");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

export function parseGeminiJson<T>(text: string): T {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("KI-Antwort konnte nicht gelesen werden");
  }
}
