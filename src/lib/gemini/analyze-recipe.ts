import { getGeminiModel, parseGeminiJson } from "@/lib/gemini/client";
import { GEMINI_IMAGE_PROMPT, GEMINI_IMAGES_PROMPT } from "@/lib/gemini/prompts";
import { normalizeImageMimeType } from "@/lib/image-mime";
import { normalizeRecipeExtraction } from "@/lib/recipe-extraction-utils";
import type { GeminiRecipeExtraction } from "@/types/database";

export interface RecipeImageInput {
  imageBase64: string;
  mimeType: string;
}

export async function analyzeRecipeImages(
  images: RecipeImageInput[]
): Promise<GeminiRecipeExtraction> {
  if (images.length === 0) {
    throw new Error("Kein Bild übergeben");
  }

  const model = getGeminiModel();
  const prompt = images.length > 1 ? GEMINI_IMAGES_PROMPT : GEMINI_IMAGE_PROMPT;

  const result = await model.generateContent([
    prompt,
    ...images.map(({ imageBase64, mimeType }) => ({
      inlineData: {
        data: imageBase64,
        mimeType: normalizeImageMimeType(mimeType),
      },
    })),
  ]);

  const parsed = parseGeminiJson<GeminiRecipeExtraction>(result.response.text());
  return normalizeRecipeExtraction(parsed);
}

/** @deprecated Nutze analyzeRecipeImages */
export async function analyzeRecipeImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiRecipeExtraction> {
  return analyzeRecipeImages([{ imageBase64, mimeType }]);
}
