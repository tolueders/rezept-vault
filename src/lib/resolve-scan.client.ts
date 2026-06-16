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
  body: Record<string, unknown>
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
  return scanRecipePhotos([file], memory);
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const mimeType = file.type || "image/jpeg";
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { base64, mimeType };
}

export async function scanRecipePhotos(
  files: File[],
  memory: Map<string, GeminiRecipeExtraction>
) {
  if (files.length === 0) {
    throw new Error("Kein Foto ausgewählt");
  }

  const { compressImageForAnalysis } = await import("@/lib/image-utils");
  const { hashFile, hashString } = await import("@/lib/content-hash.client");
  const { MAX_ANALYZE_BASE64_LENGTH } = await import("@/lib/image-mime");

  const prepared = await Promise.all(files.map((file) => compressImageForAnalysis(file)));
  const fileHashes = await Promise.all(prepared.map((file) => hashFile(file)));
  const hash = await hashString(fileHashes.join(":"));

  const cached = memory.get(hash) ?? getSessionScan<GeminiRecipeExtraction>(hash);
  if (cached) {
    memory.set(hash, cached);
    return {
      data: cached,
      fromCache: true,
      previewUrls: prepared.map((file) => URL.createObjectURL(file)),
    };
  }

  const encoded = await Promise.all(prepared.map(fileToBase64));

  for (const { base64 } of encoded) {
    if (base64.length > MAX_ANALYZE_BASE64_LENGTH) {
      throw new Error("Bild zu groß. Bitte ein kleineres Foto wählen.");
    }
  }

  const { data, fromCache } = await resolveScan(hash, memory, () =>
    fetchExtraction("/api/analyze-recipe", {
      images: encoded.map(({ base64, mimeType }) => ({
        image: base64,
        mimeType,
      })),
    })
  );

  return {
    data,
    fromCache,
    previewUrls: prepared.map((file) => URL.createObjectURL(file)),
  };
}
