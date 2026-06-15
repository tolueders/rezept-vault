#!/usr/bin/env node
/**
 * RezeptVault Setup-Checker
 * Prüft .env.local und testet die Supabase-Verbindung.
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

const PLACEHOLDERS = [
  "your-project-id",
  "your-anon-key",
  "your-gemini-api-key",
];

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("❌ .env.local fehlt. Führe aus: cp .env.local.example .env.local");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function hasPlaceholder(value) {
  if (!value) return true;
  return PLACEHOLDERS.some((p) => value.includes(p));
}

async function testSupabase(url, key) {
  const res = await fetch(
    `${url}/rest/v1/recipe_categories?select=id&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "count=exact",
      },
    }
  );
  const countHeader = res.headers.get("content-range");
  const count = countHeader?.match(/\/(\d+)$/)?.[1];
  const body = res.ok ? await res.json() : await res.text();
  return { ok: res.ok, status: res.status, body, count: count ? Number(count) : null };
}

async function main() {
  console.log("\n🔍 RezeptVault Setup-Check\n");

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const geminiKey = env.GEMINI_API_KEY;

  let allGood = true;

  // Supabase URL
  if (hasPlaceholder(url)) {
    console.log("⚠️  SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL – noch nicht konfiguriert");
    allGood = false;
  } else {
    console.log("✅ Supabase URL gesetzt");
  }

  if (hasPlaceholder(anonKey)) {
    console.log("⚠️  SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY – noch nicht konfiguriert");
    allGood = false;
  } else {
    console.log("✅ Supabase Anon Key gesetzt");
  }

  // Gemini
  if (hasPlaceholder(geminiKey)) {
    console.log("⚠️  GEMINI_API_KEY – noch nicht konfiguriert (Foto-KI deaktiviert)");
  } else {
    console.log("✅ GEMINI_API_KEY gesetzt");
  }

  // Supabase connection test
  if (!hasPlaceholder(url) && !hasPlaceholder(anonKey)) {
    console.log("\n🔗 Teste Supabase-Verbindung…");
    try {
      const result = await testSupabase(url, anonKey);
      if (result.ok) {
        const total = result.count ?? (Array.isArray(result.body) ? result.body.length : 0);
        if (total > 0) {
          console.log(`✅ Supabase verbunden – ${total} Kategorien gefunden`);
          console.log("   Migrationen wurden erfolgreich ausgeführt.\n");
        } else {
          console.log("⚠️  Supabase verbunden, aber keine Kategorien gefunden.");
          console.log("   → Führe supabase/combined_migration.sql im SQL Editor aus.\n");
          allGood = false;
        }
      } else if (result.status === 404 || String(result.body).includes("relation")) {
        console.log("⚠️  Supabase erreichbar, aber Tabellen fehlen.");
        console.log("   → Führe supabase/combined_migration.sql im SQL Editor aus.\n");
        allGood = false;
      } else {
        console.log(`❌ Supabase-Fehler (${result.status}): ${result.body}\n`);
        allGood = false;
      }
    } catch (err) {
      console.log(`❌ Verbindung fehlgeschlagen: ${err.message}\n`);
      allGood = false;
    }
  } else {
    console.log("\n📋 Nächste Schritte:");
    console.log("   1. Neues Projekt: https://supabase.com/dashboard");
    console.log("   2. SQL Editor → supabase/combined_migration.sql einfügen & ausführen");
    console.log("   3. Settings → API → URL & anon key in .env.local eintragen");
    console.log("   4. Gemini Key: https://aistudio.google.com/apikey\n");
  }

  if (allGood && !hasPlaceholder(geminiKey)) {
    console.log("🎉 Alles bereit! Starte mit: npm run dev\n");
  } else if (allGood) {
    console.log("🎉 Supabase bereit! Gemini Key optional für Foto-KI.\n");
  }

  process.exit(allGood ? 0 : 1);
}

main();
