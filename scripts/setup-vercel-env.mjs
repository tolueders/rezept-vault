#!/usr/bin/env node
/**
 * Setzt Vercel-Umgebungsvariablen per CLI (Alternative zur UI).
 * Usage: npm run vercel:env
 *
 * Voraussetzung: npx vercel login && npx vercel link
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync, spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("❌ .env.local nicht gefunden");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}

function addEnv(key, value, targets = ["production", "preview"]) {
  for (const target of targets) {
    console.log(`→ ${key} (${target})`);
    const result = spawnSync(
      "npx",
      ["vercel", "env", "add", key, target, "--force"],
      {
        input: value,
        encoding: "utf-8",
        cwd: root,
        stdio: ["pipe", "inherit", "inherit"],
      }
    );
    if (result.status !== 0) {
      console.error(`❌ Fehler bei ${key} / ${target}`);
    }
  }
}

console.log("\n🚀 Vercel Environment Variables Setup\n");

try {
  execSync("npx vercel whoami", { cwd: root, stdio: "pipe" });
} catch {
  console.log("Bitte zuerst einloggen:\n  npx vercel login\n");
  process.exit(1);
}

if (!existsSync(resolve(root, ".vercel/project.json"))) {
  console.log("Projekt verknüpfen:\n  npx vercel link\n");
  console.log('Wähle Team → Existing Project → "rezepte-alpha"\n');
  process.exit(1);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Supabase URL/Key fehlen in .env.local");
  process.exit(1);
}

// Server-Namen ohne NEXT_PUBLIC_ – funktionieren als Sensitive auf Vercel
addEnv("SUPABASE_URL", url);
addEnv("SUPABASE_ANON_KEY", key);
addEnv("NEXT_PUBLIC_APP_URL", "https://rezepte-alpha.vercel.app");

if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes("your-")) {
  addEnv("GEMINI_API_KEY", env.GEMINI_API_KEY);
}

console.log("\n✅ Fertig! Jetzt in Vercel: Deployments → Redeploy (ohne Cache)\n");
