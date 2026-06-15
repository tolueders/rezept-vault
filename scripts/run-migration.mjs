#!/usr/bin/env node
/**
 * Führt combined_migration.sql gegen Supabase aus.
 * Benötigt SUPABASE_DB_PASSWORD oder SUPABASE_ACCESS_TOKEN in .env.local
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const PROJECT_REF = "qexsvvvhnqlsdmsnrsjs";

function loadEnvFile() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return {};
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

async function runViaManagementApi(token, sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Management API (${res.status}): ${body}`);
  }
  return body;
}

async function runViaPostgres(password, sql) {
  const client = new pg.Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    user: "postgres",
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  const env = loadEnvFile();
  if (env.SUPABASE_ACCESS_TOKEN) return env.SUPABASE_ACCESS_TOKEN;

  // macOS: Supabase CLI Token aus Keychain
  if (process.platform === "darwin") {
    try {
      const { execSync } = await import("child_process");
      const raw = execSync(
        'security find-generic-password -s "Supabase CLI" -a "supabase" -w 2>/dev/null',
        { encoding: "utf-8" }
      ).trim();
      if (raw.startsWith("go-keyring-base64:")) {
        return Buffer.from(raw.replace("go-keyring-base64:", ""), "base64").toString("utf-8");
      }
      return raw;
    } catch {
      // ignore
    }
  }
  return null;
}

async function main() {
  const env = loadEnvFile();
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || env.SUPABASE_DB_PASSWORD;
  const accessToken = await getAccessToken();

  const sql = readFileSync(
    resolve(root, "supabase/combined_migration.sql"),
    "utf-8"
  );

  console.log("🚀 Starte Datenbank-Migration…\n");

  if (accessToken) {
    console.log("→ Via Supabase Management API");
    await runViaManagementApi(accessToken, sql);
  } else if (dbPassword) {
    console.log("→ Via PostgreSQL-Verbindung");
    await runViaPostgres(dbPassword, sql);
  } else {
    console.error("❌ Fehlende Credentials.");
    console.error(
      "   Füge SUPABASE_DB_PASSWORD oder SUPABASE_ACCESS_TOKEN in .env.local hinzu."
    );
    console.error("\n   DB-Passwort: Supabase Dashboard → Project Settings → Database");
    console.error(
      "   Access Token: https://supabase.com/dashboard/account/tokens\n"
    );
    process.exit(1);
  }

  console.log("✅ Migration erfolgreich ausgeführt!\n");
}

main().catch((err) => {
  console.error("❌ Migration fehlgeschlagen:", err.message);
  process.exit(1);
});
