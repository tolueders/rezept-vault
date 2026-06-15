/** Max. Base64-Länge (~3 MB Bild) – Vercel Request-Limit beachten. */
export const MAX_ANALYZE_BASE64_LENGTH = 4_000_000;

export function normalizeImageMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().split(";")[0].trim();
  if (normalized === "image/jpg") return "image/jpeg";
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(normalized)) {
    return normalized;
  }
  return "image/jpeg";
}
