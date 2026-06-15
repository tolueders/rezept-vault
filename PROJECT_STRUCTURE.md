# Projektstruktur – RezeptVault

```
rezept-vault/
├── public/
│   ├── icons/              # PWA Icons (192, 512)
│   ├── manifest.json       # PWA Manifest
│   └── sw.js               # Service Worker
├── src/
│   ├── app/
│   │   ├── (auth)/         # Login, Register, Passwort vergessen
│   │   ├── (dashboard)/    # Geschützte App-Bereiche
│   │   │   ├── recipes/    # Rezeptliste, Detail, Erstellen, Bearbeiten
│   │   │   ├── favorites/
│   │   │   ├── meal-plan/
│   │   │   ├── shopping-list/
│   │   │   └── profile/
│   │   ├── recipe/[slug]/  # Öffentliche Rezept-URLs
│   │   ├── api/
│   │   │   └── analyze-recipe/  # Gemini Vision API
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Landing Page
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/           # Login, Register Forms
│   │   ├── layout/         # App Header, Navigation
│   │   ├── recipes/        # Rezept-Komponenten
│   │   ├── meal-plan/      # Wochenplanung
│   │   ├── shopping/       # Einkaufsliste
│   │   ├── profile/        # Profil
│   │   └── ui/             # shadcn/ui Komponenten
│   ├── lib/
│   │   ├── actions/        # Server Actions (CRUD)
│   │   ├── queries/        # Datenbank-Abfragen
│   │   ├── supabase/       # Client, Server, Middleware
│   │   ├── gemini/         # KI-Integration
│   │   ├── validations/    # Zod Schemas
│   │   ├── constants.ts
│   │   ├── recipe-utils.ts
│   │   └── image-utils.ts
│   ├── types/
│   │   └── database.ts     # TypeScript Typen
│   └── middleware.ts       # Auth-Schutz
├── supabase/
│   └── migrations/         # SQL Schema, RLS, Storage
├── INSTALLATION.md
├── SUPABASE_SETUP.md
├── GEMINI_SETUP.md
├── DEPLOYMENT.md
└── PROJECT_STRUCTURE.md
```

## Architektur

### Frontend
- **Next.js 15 App Router** mit Server & Client Components
- **Server Actions** für Mutationen (Rezepte, Favoriten, Wochenplan)
- **React Hook Form + Zod** für Formularvalidierung
- **shadcn/ui + Tailwind CSS v4** für UI

### Backend
- **Supabase PostgreSQL** mit Row Level Security
- **Supabase Auth** (E-Mail + Passwort)
- **Supabase Storage** für Bilder

### Sicherheit
- Middleware prüft Session für geschützte Routen
- RLS verhindert unbefugten Datenzugriff
- Gemini API Key nur serverseitig

### Performance
- Next.js Image Optimization
- Lazy Loading für Rezeptkarten
- Pagination (12 Rezepte pro Seite)
- Clientseitige Bildkompression vor Upload
- Service Worker für Offline-Basis (PWA)

## Routing

| Route | Beschreibung | Auth |
|-------|-------------|------|
| `/` | Landing Page | Nein |
| `/login` | Anmeldung | Nein |
| `/register` | Registrierung | Nein |
| `/recipes` | Meine Rezepte | Ja |
| `/recipes/new` | Rezept erstellen | Ja |
| `/recipes/[id]` | Rezeptdetail | Ja |
| `/recipes/[id]/edit` | Bearbeiten | Ja |
| `/recipes/[id]/cook` | Kochmodus | Ja |
| `/favorites` | Favoriten | Ja |
| `/meal-plan` | Wochenplanung | Ja |
| `/shopping-list` | Einkaufsliste | Ja |
| `/profile` | Profil | Ja |
| `/recipe/[slug]` | Öffentliches Rezept | Nein |

## Pakete

### Produktion
| Paket | Zweck |
|-------|-------|
| `next` | Framework |
| `@supabase/supabase-js` | Supabase Client |
| `@supabase/ssr` | SSR Auth |
| `react-hook-form` | Formulare |
| `@hookform/resolvers` | Zod Integration |
| `zod` | Validierung |
| `sonner` | Toasts |
| `lucide-react` | Icons |
| `date-fns` | Datumsformatierung |
| `slugify` | URL-Slugs |
| `browser-image-compression` | Bildkompression |
| `react-easy-crop` | Bild zuschneiden |
| `@google/generative-ai` | Gemini Vision |
| `clsx`, `tailwind-merge`, `class-variance-authority` | UI Utilities |

### Entwicklung
| Paket | Zweck |
|-------|-------|
| `typescript` | Typisierung |
| `tailwindcss` | Styling |
| `eslint`, `eslint-config-next` | Linting |
