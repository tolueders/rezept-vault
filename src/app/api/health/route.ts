import { NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabaseUrl: !!getSupabaseUrl(),
    supabaseKey: !!getSupabaseAnonKey(),
    geminiKey: !!process.env.GEMINI_API_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  });
}
