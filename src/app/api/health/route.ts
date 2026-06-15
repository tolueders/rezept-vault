import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
  });
}
