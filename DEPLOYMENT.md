# Deployment – Vercel

## Voraussetzungen

- GitHub Repository mit dem Projekt
- Supabase-Projekt eingerichtet (siehe `SUPABASE_SETUP.md`)
- Gemini API Key (siehe `GEMINI_SETUP.md`)

## 1. Vercel Projekt erstellen

1. Gehe zu [vercel.com](https://vercel.com)
2. **Add New Project** → GitHub Repository importieren
3. Framework Preset: **Next.js** (automatisch erkannt)

## 2. Umgebungsvariablen

Unter **Settings → Environment Variables**:

| Variable | Wert |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon Key |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `NEXT_PUBLIC_APP_URL` | `https://deine-app.vercel.app` |

## 3. Supabase Auth URLs aktualisieren

Im Supabase Dashboard unter **Authentication → URL Configuration**:

| Einstellung | Wert |
|-------------|------|
| Site URL | `https://deine-app.vercel.app` |
| Redirect URLs | `https://deine-app.vercel.app/**` |

## 4. Deploy

```bash
git push origin main
```

Vercel baut und deployed automatisch bei jedem Push.

## 5. Custom Domain (optional)

1. Vercel → **Settings → Domains**
2. Domain hinzufügen und DNS konfigurieren
3. `NEXT_PUBLIC_APP_URL` und Supabase Redirect URLs aktualisieren

## 6. PWA auf Produktion

- Service Worker wird nur in `production` registriert
- Manifest unter `/manifest.json` erreichbar
- Icons unter `/icons/`

Teste die Installation auf:
- iPhone/iPad (Safari)
- Android (Chrome)
- Desktop (Chrome/Edge)

## 7. Performance-Checkliste

- [ ] Supabase Region nahe an Vercel Region wählen
- [ ] Bilder in WebP hochladen (automatisch via App)
- [ ] Vercel Analytics optional aktivieren
- [ ] Gemini API Rate Limits überwachen

## 8. Troubleshooting

| Problem | Lösung |
|---------|--------|
| Auth Redirect Loop | Supabase Site URL prüfen |
| Bilder laden nicht | `next.config.ts` remotePatterns + Storage Bucket public |
| 500 bei Foto-Analyse | `GEMINI_API_KEY` in Vercel Env prüfen |
| RLS Fehler | Migration 002 ausgeführt? User eingeloggt? |
