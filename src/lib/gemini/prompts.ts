/** Minimal – JSON-Struktur kommt aus responseSchema in client.ts */
const SERVINGS_HINT = "servings+Mengen exakt wie im Rezept.";

export const GEMINI_IMAGE_PROMPT = `Rezept aus Bild. Deutsch. ${SERVINGS_HINT}`;
export const GEMINI_IMAGES_PROMPT = `Rezept aus Bildern zusammenführen. Deutsch. ${SERVINGS_HINT}`;
export const GEMINI_TEXT_PROMPT_PREFIX = `Rezept extrahieren. Deutsch. ${SERVINGS_HINT}\n\n`;

/** Max. Zeichen für Text/URL-Import (Input-Tokens begrenzen) */
export const MAX_RECIPE_TEXT_LENGTH = 5000;
