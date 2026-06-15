import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
} from "@google/generative-ai";

/** gemini-2.0-flash was shut down 2026-06-01; use a current Flash model. */
export const GEMINI_MODEL = "gemini-2.5-flash";

const RECIPE_JSON_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    servings: { type: SchemaType.NUMBER },
    cook_time_minutes: { type: SchemaType.NUMBER },
    difficulty: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["einfach", "mittel", "schwer"],
    },
    ingredients: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
          unit: { type: SchemaType.STRING },
        },
        required: ["name", "amount", "unit"],
      },
    },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          instruction: { type: SchemaType.STRING },
        },
        required: ["instruction"],
      },
    },
  },
  required: ["title", "ingredients", "steps"],
};

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ist nicht konfiguriert");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_JSON_SCHEMA,
    },
  });
}

export function parseGeminiJson<T>(text: string): T {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("KI-Antwort konnte nicht gelesen werden");
  }
}

export function getGeminiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Rezept konnte nicht analysiert werden";
  }

  const msg = error.message;
  if (msg.includes("GEMINI_API_KEY")) {
    return "Gemini API Key fehlt. Siehe GEMINI_SETUP.md";
  }
  if (msg.includes("429") || msg.includes("quota")) {
    return "Gemini API-Limit erreicht. Bitte später erneut versuchen.";
  }
  if (msg.includes("API key") || msg.includes("API_KEY_INVALID")) {
    return "Gemini API Key ungültig";
  }
  if (msg.includes("Unsupported MIME") || msg.includes("mimeType")) {
    return "Bildformat wird nicht unterstützt. Bitte JPG oder PNG verwenden.";
  }

  return msg.split("\n")[0].slice(0, 200);
}
