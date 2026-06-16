import { getGeminiModel, parseGeminiJson } from "@/lib/gemini/client";
import { GEMINI_IMAGE_PROMPT } from "@/lib/gemini/prompts";
import { normalizeImageMimeType } from "@/lib/image-mime";
import { normalizeRecipeExtraction } from "@/lib/recipe-extraction-utils";
import type { GeminiRecipeExtraction } from "@/types/database";

export async function analyzeRecipeImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiRecipeExtraction> {
  const model = getGeminiModel();
  const normalizedMime = normalizeImageMimeType(mimeType);

  const result = await model.generateContent([
    GEMINI_IMAGE_PROMPT,
    {
      inlineData: {
        data: imageBase64,
        mimeType: normalizedMime,
      },
    },
  ]);

  const parsed = parseGeminiJson<GeminiRecipeExtraction>(result.response.text());
  return normalizeRecipeExtraction(parsed);
}
