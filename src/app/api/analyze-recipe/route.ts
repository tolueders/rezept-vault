import { NextRequest, NextResponse } from "next/server";
import { analyzeRecipeImage } from "@/lib/gemini/analyze-recipe";
import { getGeminiErrorMessage } from "@/lib/gemini/client";
import { MAX_ANALYZE_BASE64_LENGTH } from "@/lib/image-mime";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const { image, mimeType } = body as { image: string; mimeType: string };

    if (!image || !mimeType) {
      return NextResponse.json({ error: "Bild fehlt" }, { status: 400 });
    }

    if (image.length > MAX_ANALYZE_BASE64_LENGTH) {
      return NextResponse.json(
        { error: "Bild zu groß. Bitte ein kleineres Foto wählen." },
        { status: 413 }
      );
    }

    const extraction = await analyzeRecipeImage(image, mimeType);
    return NextResponse.json(extraction);
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return NextResponse.json(
      { error: getGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
