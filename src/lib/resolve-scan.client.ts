import type { GeminiRecipeExtraction } from "@/types/database";
import { getSessionScan, setSessionScan } from "@/lib/content-hash.client";

export async function resolveScan(
  hash: string,
  memory: Map<string, GeminiRecipeExtraction>,
  fetchFromApi: () => Promise<GeminiRecipeExtraction>
): Promise<{ data: GeminiRecipeExtraction; fromCache: boolean }> {
  const cached = memory.get(hash) ?? getSessionScan<GeminiRecipeExtraction>(hash);
  if (cached) {
    memory.set(hash, cached);
    return { data: cached, fromCache: true };
  }

  const data = await fetchFromApi();
  memory.set(hash, data);
  setSessionScan(hash, data);
  return { data, fromCache: false };
}

async function fetchExtraction(
  endpoint: string,
  body: Record<string, string>
): Promise<GeminiRecipeExtraction> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Analyse fehlgeschlagen");
  return data as GeminiRecipeExtraction;
}

export async function scanRecipeText(
  text: string,
  memory: Map<string, GeminiRecipeExtraction>
) {
  const { hashString } = await import("@/lib/content-hash.client");
  const hash = await hashString(text.trim());
  return resolveScan(hash, memory, () =>
    fetchExtraction("/api/import-recipe-text", { text: text.trim() })
  );
}

export async function scanRecipeUrl(
  url: string,
  memory: Map<string, GeminiRecipeExtraction>
) {
  const { hashString } = await import("@/lib/content-hash.client");
  const hash = await hashString(url.trim().toLowerCase());
  return resolveScan(hash, memory, () =>
    fetchExtraction("/api/import-recipe", { url: url.trim() })
  );
}

export async function scanRecipePhoto(
  file: File,
  memory: Map<string, GeminiRecipeExtraction>
) {
  const { compressImageForAnalysis } = await import("@/lib/image-utils");
  const { hashFile } = await import("@/lib/content-hash.client");
  const { MAX_ANALYZE_BASE64_LENGTH } = await import("@/lib/image-mime");

  const prepared = await compressImageForAnalysis(file);
  const hash = await hashFile(prepared);
  const mimeType = prepared.type || "image/jpeg";

  const cached = memory.get(hash) ?? getSessionScan<GeminiRecipeExtraction>(hash);
  if (cached) {
    memory.set(hash, cached);
    return { data: cached, fromCache: true, previewUrl: URL.createObjectURL(prepared) };
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(prepared);
  });

  if (base64.length > MAX_ANALYZE_BASE64_LENGTH) {
    throw new Error("Bild zu groß. Bitte ein kleineres Foto wählen.");
  }

  const { data, fromCache } = await resolveScan(hash, memory, () =>
    fetchExtraction("/api/analyze-recipe", { image: base64, mimeType })
  );

  return { data, fromCache, previewUrl: URL.createObjectURL(prepared) };
}
