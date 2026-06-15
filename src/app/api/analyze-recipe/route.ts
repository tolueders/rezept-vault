import { NextRequest, NextResponse } from "next/server";
import { analyzeRecipeImage } from "@/lib/gemini/analyze-recipe";
import { createClient } from "@/lib/supabase/server";

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

    const extraction = await analyzeRecipeImage(image, mimeType);
    return NextResponse.json(extraction);
  } catch (error) {
    console.error("Gemini analysis error:", error);
    const message =
      error instanceof Error
        ? error.message.includes("GEMINI_API_KEY")
          ? "Gemini API Key fehlt. Siehe GEMINI_SETUP.md"
          : error.message
        : "Rezept konnte nicht analysiert werden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
