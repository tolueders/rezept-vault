# RezeptVault – Installation

## Voraussetzungen

- Node.js 20+
- npm
- Ein **neues** Supabase-Projekt ([supabase.com](https://supabase.com))
- Google Gemini API Key ([aistudio.google.com](https://aistudio.google.com))

## Schnellstart

```bash
# Repository klonen / Ordner öffnen
cd rezept-vault

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.local.example .env.local
# .env.local mit deinen Werten bearbeiten

# Entwicklungsserver starten
npm run dev
```

Die App läuft unter [http://localhost:3000](http://localhost:3000).

## Umgebungsvariablen

| Variable | Beschreibung |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public Key |
| `GEMINI_API_KEY` | Google Gemini API Key (serverseitig) |
| `NEXT_PUBLIC_APP_URL` | App-URL (lokal: `http://localhost:3000`) |

## Supabase einrichten

Führe die SQL-Migrationen in der Reihenfolge aus (siehe `SUPABASE_SETUP.md`):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_storage.sql`

## Gemini einrichten

Siehe `GEMINI_SETUP.md` für die KI-gestützte Rezept-Erkennung per Foto.

## Produktions-Build

```bash
npm run build
npm start
```

## PWA installieren

Nach dem Deployment kann die App auf iPhone, iPad, Android und Desktop installiert werden:

- **iOS:** Safari → Teilen → „Zum Home-Bildschirm“
- **Android:** Chrome → Menü → „App installieren“
- **Desktop:** Chrome/Edge → Adressleiste → Installieren

## Projektstruktur

Details in `PROJECT_STRUCTURE.md`.

## Deployment

Siehe `DEPLOYMENT.md` für Vercel-Deployment.
