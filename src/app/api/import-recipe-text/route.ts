import { NextRequest, NextResponse } from "next/server";
import { parseRecipeText } from "@/lib/gemini/import-from-text";
import { getGeminiErrorMessage } from "@/lib/gemini/client";
import { hashContent, withScanCache } from "@/lib/gemini/scan-cache";
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
    const { text } = body as { text: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text fehlt" }, { status: 400 });
    }

    const normalized = text.trim();
    const contentHash = hashContent(normalized);
    const extraction = await withScanCache(user.id, contentHash, "text", () =>
      parseRecipeText(normalized)
    );

    return NextResponse.json(extraction);
  } catch (error) {
    console.error("Text import error:", error);
    return NextResponse.json(
      { error: getGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
