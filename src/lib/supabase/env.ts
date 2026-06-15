function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function getSupabaseUrl(): string | undefined {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readEnv("SUPABASE_URL");
}

export function getSupabaseAnonKey(): string | undefined {
  return (
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? readEnv("SUPABASE_ANON_KEY")
  );
}

export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL und Anon Key fehlen. Setze SUPABASE_URL und SUPABASE_ANON_KEY in Vercel (oder NEXT_PUBLIC_* lokal)."
    );
  }

  return { url, anonKey };
}
