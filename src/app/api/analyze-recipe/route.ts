import { NextRequest, NextResponse } from "next/server";
import { analyzeRecipeImages } from "@/lib/gemini/analyze-recipe";
import { getGeminiErrorMessage } from "@/lib/gemini/client";
import { hashContent, withScanCache } from "@/lib/gemini/scan-cache";
import { MAX_ANALYZE_BASE64_LENGTH } from "@/lib/image-mime";
import { MAX_RECIPE_SCAN_PHOTOS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type ImagePayload = { image: string; mimeType: string };

function parseImages(body: Record<string, unknown>): ImagePayload[] | null {
  if (Array.isArray(body.images) && body.images.length > 0) {
    return body.images as ImagePayload[];
  }
  if (typeof body.image === "string" && typeof body.mimeType === "string") {
    return [{ image: body.image, mimeType: body.mimeType }];
  }
  return null;
}

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
    const images = parseImages(body);

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "Bild fehlt" }, { status: 400 });
    }

    if (images.length > MAX_RECIPE_SCAN_PHOTOS) {
      return NextResponse.json(
        { error: `Maximal ${MAX_RECIPE_SCAN_PHOTOS} Bilder erlaubt` },
        { status: 400 }
      );
    }

    for (const { image } of images) {
      if (!image || image.length > MAX_ANALYZE_BASE64_LENGTH) {
        return NextResponse.json(
          { error: "Bild zu groß. Bitte ein kleineres Foto wählen." },
          { status: 413 }
        );
      }
    }

    const contentHash = hashContent(images.map((i) => i.image).join(":"));
    const extraction = await withScanCache(user.id, contentHash, "image", () =>
      analyzeRecipeImages(
        images.map(({ image, mimeType }) => ({ imageBase64: image, mimeType }))
      )
    );

    return NextResponse.json(extraction);
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return NextResponse.json(
      { error: getGeminiErrorMessage(error) },
      { status: 500 }
    );
  }
}
