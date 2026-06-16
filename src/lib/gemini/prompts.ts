/** Kurze Prompts – Struktur kommt aus responseSchema in client.ts */
export const GEMINI_IMAGE_PROMPT = "Rezept aus Bild extrahieren. Deutsch.";
export const GEMINI_IMAGES_PROMPT =
  "Rezept aus allen Bildern extrahieren (mehrere Seiten/Ansichten desselben Rezepts). Zutaten und Schritte zusammenführen, nichts doppelt. Deutsch.";
export const GEMINI_TEXT_PROMPT_PREFIX = "Rezept aus Text extrahieren. Deutsch.\n\n";

/** Max. Text-Tokens für Link-/Text-Import */
export const MAX_RECIPE_TEXT_LENGTH = 8000;
