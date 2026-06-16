export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return hashBuffer(buffer);
}

export async function hashString(text: string): Promise<string> {
  const buffer = new TextEncoder().encode(text).buffer;
  return hashBuffer(buffer);
}

async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const SESSION_PREFIX = "recipe-scan:";

export function getSessionScan<T>(hash: string): T | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${hash}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setSessionScan(hash: string, data: unknown): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${hash}`, JSON.stringify(data));
  } catch {
    /* quota exceeded – ignore */
  }
}
