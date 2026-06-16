import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { GeminiRecipeExtraction } from "@/types/database";

export type ScanSourceType = "image" | "text" | "url";

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function getCachedExtraction(
  userId: string,
  contentHash: string
): Promise<GeminiRecipeExtraction | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipe_scan_cache")
    .select("extraction")
    .eq("user_id", userId)
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (error || !data?.extraction) return null;
  return data.extraction as GeminiRecipeExtraction;
}

export async function saveCachedExtraction(
  userId: string,
  contentHash: string,
  sourceType: ScanSourceType,
  extraction: GeminiRecipeExtraction
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("recipe_scan_cache").upsert(
    {
      user_id: userId,
      content_hash: contentHash,
      source_type: sourceType,
      extraction,
    },
    { onConflict: "user_id,content_hash" }
  );
}

export async function withScanCache(
  userId: string,
  contentHash: string,
  sourceType: ScanSourceType,
  extract: () => Promise<GeminiRecipeExtraction>
): Promise<GeminiRecipeExtraction> {
  const cached = await getCachedExtraction(userId, contentHash);
  if (cached) return cached;

  const extraction = await extract();
  await saveCachedExtraction(userId, contentHash, sourceType, extraction);
  return extraction;
}
