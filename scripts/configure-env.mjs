#!/usr/bin/env node
/**
 * Schreibt Supabase- und optional Gemini-Credentials in .env.local
 * Usage: node scripts/configure-env.mjs --url=... --key=... [--gemini=...]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, ...v] = arg.replace(/^--/, "").split("=");
    return [k, v.join("=")];
  })
);

if (!args.url && !args.key && !args.gemini) {
  console.log(`
RezeptVault – Umgebung konfigurieren

Usage:
  npm run setup:env -- --url=https://xxx.supabase.co --key=eyJ... [--gemini=AIza...]

Parameter:
  --url     NEXT_PUBLIC_SUPABASE_URL
  --key     NEXT_PUBLIC_SUPABASE_ANON_KEY
  --gemini  GEMINI_API_KEY (optional)
`);
  process.exit(0);
}

let content = existsSync(envPath)
  ? readFileSync(envPath, "utf-8")
  : readFileSync(resolve(__dirname, "..", ".env.local.example"), "utf-8");

function setVar(name, value) {
  const regex = new RegExp(`^${name}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${name}=${value}`);
  } else {
    content += `\n${name}=${value}`;
  }
}

if (args.url) setVar("NEXT_PUBLIC_SUPABASE_URL", args.url);
if (args.key) setVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", args.key);
if (args.gemini) setVar("GEMINI_API_KEY", args.gemini);
setVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

writeFileSync(envPath, content.trim() + "\n");
console.log("✅ .env.local aktualisiert");
console.log("   Führe aus: npm run setup:check");
