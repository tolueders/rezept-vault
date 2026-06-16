/** Max. Base64-Länge für KI-Scan (~800px JPEG). */
export const MAX_ANALYZE_BASE64_LENGTH = 1_200_000;

export function normalizeImageMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(";")[0].trim();
  if (normalized === "image/jpg") return "image/jpeg";
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(normalized)) {
    return normalized;
  }
  return "image/jpeg";
}
