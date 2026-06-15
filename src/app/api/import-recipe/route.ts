import { NextRequest, NextResponse } from "next/server";
import { fetchAndParseRecipeUrl } from "@/lib/gemini/import-from-url";
import { getGeminiErrorMessage } from "@/lib/gemini/client";
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
    const { url } = body as { url: string };

    if (!url?.trim()) {
      return NextResponse.json({ error: "URL fehlt" }, { status: 400 });
    }

    const extraction = await fetchAndParseRecipeUrl(url.trim());
    return NextResponse.json(extraction);
  } catch (error) {
    console.error("URL import error:", error);
    return NextResponse.json(
      { error: getGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
