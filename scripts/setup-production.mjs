#!/usr/bin/env node
/**
 * Aktualisiert Supabase Auth-URLs für Produktion (Vercel).
 * Usage: npm run setup:production -- --url=https://deine-app.vercel.app
 */
import { execSync } from "child_process";

const PROJECT_REF = "qexsvvvhnqlsdmsnrsjs";

function getAccessToken() {
  if (process.platform !== "darwin") return process.env.SUPABASE_ACCESS_TOKEN || null;
  try {
    const raw = execSync(
      'security find-generic-password -s "Supabase CLI" -a "supabase" -w 2>/dev/null',
      { encoding: "utf-8" }
    ).trim();
    if (raw.startsWith("go-keyring-base64:")) {
      return Buffer.from(raw.replace("go-keyring-base64:", ""), "base64").toString("utf-8");
    }
    return raw;
  } catch {
    return process.env.SUPABASE_ACCESS_TOKEN || null;
  }
}

const appUrl = process.argv.find((a) => a.startsWith("--url="))?.slice(6);
if (!appUrl) {
  console.log("Usage: npm run setup:production -- --url=https://deine-app.vercel.app");
  process.exit(1);
}

const token = getAccessToken();
if (!token) {
  console.error("❌ Supabase Access Token nicht gefunden.");
  process.exit(1);
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: appUrl,
      uri_allow_list: `${appUrl}/**`,
      mailer_autoconfirm: true,
    }),
  }
);

if (!res.ok) {
  console.error("❌ Fehler:", await res.text());
  process.exit(1);
}

console.log(`✅ Supabase Auth konfiguriert für ${appUrl}`);
