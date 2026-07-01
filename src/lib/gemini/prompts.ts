/** Kurze Prompts – Feldstruktur kommt aus responseSchema in client.ts */
const EXTRACTION_RULES = [
  "description: Einleitung/Kurzbeschreibung zum Gericht wörtlich übernehmen (leer wenn keine vorhanden).",
  "steps: Jeden Zubereitungsschritt vollständig und wörtlich, nichts weglassen oder zusammenfassen.",
  "ingredients: Alle Zutaten mit exakten Mengen und Einheiten.",
  "servings: Portionen exakt wie angegeben.",
].join(" ");

export const GEMINI_IMAGE_PROMPT = `Rezept aus Bild extrahieren. Deutsch. ${EXTRACTION_RULES}`;
export const GEMINI_IMAGES_PROMPT = `Rezept aus allen Bildern zusammenführen. Deutsch. ${EXTRACTION_RULES}`;
export const GEMINI_TEXT_PROMPT_PREFIX = `Rezept aus Text extrahieren. Deutsch. ${EXTRACTION_RULES}\n\n`;

/** Max. Zeichen für Text/URL-Import (Input-Tokens begrenzen) */
export const MAX_RECIPE_TEXT_LENGTH = 7000;
