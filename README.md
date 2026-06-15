# RezeptVault

Persönliche Rezeptsammlung mit optionalen Community-Funktionen – Rezepte speichern, per Foto digitalisieren, Wochenplanung, Einkaufslisten und mehr.

**Live (lokal):** [http://localhost:3000](http://localhost:3000)  
**Repository:** [github.com/tolueders/rezept-vault](https://github.com/tolueders/rezept-vault)

## Features

- Rezepte manuell anlegen oder per **Foto + Gemini Vision** extrahieren
- Kategorien, Tags, Bewertungen, Kommentare, Favoriten
- Öffentliche Rezept-URLs zum Teilen und Übernehmen
- Rezeptvarianten, Portionsrechner, Kochmodus
- Wochenplanung → automatische Einkaufsliste
- PWA – installierbar auf iPhone, Android & Desktop

## Tech Stack

Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Gemini Vision

## Schnellstart

```bash
npm install
cp .env.local.example .env.local
# Keys eintragen (siehe INSTALLATION.md)
npm run db:migrate          # Migration (macOS + Supabase CLI Login)
npm run setup:check
npm run dev
```

## Skripte

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm run setup:check` | Env & Supabase prüfen |
| `npm run setup:guide` | Interaktive Einrichtungs-Anleitung |
| `npm run setup:env` | `.env.local` befüllen |
| `npm run db:migrate` | SQL-Migration ausführen |

## Dokumentation

- [INSTALLATION.md](./INSTALLATION.md)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [GEMINI_SETUP.md](./GEMINI_SETUP.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## Deployment (Vercel)

1. Repository auf [vercel.com/new](https://vercel.com/new) importieren
2. Umgebungsvariablen setzen (aus `.env.local.example`)
3. Supabase Auth URLs auf die Vercel-Domain aktualisieren

Details: [DEPLOYMENT.md](./DEPLOYMENT.md)
