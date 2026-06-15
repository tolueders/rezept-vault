#!/usr/bin/env node
/**
 * Interaktive Setup-Anleitung für Supabase Cloud
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const combinedSql = resolve(root, "supabase/combined_migration.sql");

console.log(`
╔══════════════════════════════════════════════════════════════╗
║           RezeptVault – Supabase Einrichtung                 ║
╚══════════════════════════════════════════════════════════════╝

Schritt 1: Neues Supabase-Projekt anlegen
─────────────────────────────────────────
  → Öffne: https://supabase.com/dashboard/new/new-project

  Einstellungen:
  • Name:        rezeptvault (oder frei wählbar)
  • Datenbank-Passwort: sicher notieren
  • Region:      Frankfurt (eu-central-1) empfohlen

  Warte ~2 Minuten bis das Projekt bereit ist.


Schritt 2: Datenbank-Migration ausführen
─────────────────────────────────────────
  → Öffne: https://supabase.com/dashboard/project/_/sql/new
    (ersetze _ durch deine Project ID)

  • Kopiere den gesamten Inhalt von:
    supabase/combined_migration.sql
  • Füge ihn in den SQL Editor ein
  • Klicke „Run“

  ✅ Erfolg: 7 Kategorien + alle Tabellen werden angelegt


Schritt 3: Auth konfigurieren
──────────────────────────────
  → Authentication → URL Configuration

  • Site URL:          http://localhost:3000
  • Redirect URLs:     http://localhost:3000/**

  → Authentication → Providers → Email
  • Email aktiviert lassen
  • „Confirm email“ für Entwicklung DEAKTIVIEREN


Schritt 4: API-Keys in .env.local eintragen
────────────────────────────────────────────
  → Project Settings → API

  Dann im Terminal:

  npm run setup:env -- \\
    --url=https://DEINE-PROJECT-ID.supabase.co \\
    --key=DEIN-ANON-KEY

  Optional (Foto-KI):
  npm run setup:env -- --gemini=DEIN-GEMINI-KEY


Schritt 5: Verbindung prüfen & App starten
───────────────────────────────────────────
  npm run setup:check
  npm run dev

  → http://localhost:3000/register

`);

// SQL-Datei Info
if (existsSync(combinedSql)) {
  const lines = readFileSync(combinedSql, "utf-8").split("\n").length;
  console.log(`📄 combined_migration.sql: ${lines} Zeilen bereit\n`);
}

// Versuche SQL-Datei in Zwischenablage zu kopieren (macOS)
try {
  const sql = readFileSync(combinedSql, "utf-8");
  execSync("pbcopy", { input: sql });
  console.log("📋 SQL-Migration wurde in die Zwischenablage kopiert!");
  console.log("   Einfach im Supabase SQL Editor einfügen (Cmd+V)\n");
} catch {
  console.log("💡 Tipp: Öffne supabase/combined_migration.sql und kopiere den Inhalt manuell.\n");
}

// Dashboard öffnen (macOS)
try {
  execSync("open https://supabase.com/dashboard/new/new-project", { stdio: "ignore" });
  console.log("🌐 Supabase Dashboard wurde im Browser geöffnet.\n");
} catch {
  // ignore
}
