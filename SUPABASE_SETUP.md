# Supabase Setup – RezeptVault

> **Wichtig:** Dieses Projekt ist für ein **komplett neues, eigenständiges** Supabase-Projekt vorbereitet. Verwende keine bestehenden Projekte oder geteilten Credentials.

## 1. Neues Projekt erstellen

1. Gehe zu [supabase.com/dashboard](https://supabase.com/dashboard)
2. Klicke **New Project**
3. Wähle Organisation, Name (`rezeptvault`), Region und Passwort
4. Warte, bis das Projekt bereit ist

## 2. API-Keys kopieren

Unter **Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. SQL-Migrationen ausführen

Im **SQL Editor** nacheinander ausführen:

### Migration 001 – Schema

Datei: `supabase/migrations/001_initial_schema.sql`

Enthält:
- Tabellen: `profiles`, `recipes`, `recipe_categories`, `custom_categories`, `recipe_tags`, `recipe_ingredients`, `recipe_steps`, `recipe_ratings`, `recipe_comments`, `recipe_favorites`, `recipe_variants`, `meal_plans`, `meal_plan_entries`, `shopping_lists`, `shopping_list_items`
- Enums: `difficulty_level`, `meal_type`
- Trigger für Profil-Erstellung bei Registrierung
- Trigger für Bewertungsstatistik
- Vordefinierte Kategorien (Frühstück, Mittagessen, …)

### Migration 002 – RLS Policies

Datei: `supabase/migrations/002_rls_policies.sql`

Sicherheitsregeln:
- Nutzer sehen/bearbeiten nur eigene Inhalte
- Öffentliche Rezepte (`is_public = true`) sind für alle lesbar
- Kommentare/Bewertungen nur auf zugänglichen Rezepten

### Migration 003 – Storage

Datei: `supabase/migrations/003_storage.sql`

Buckets:
- `recipe-images` (öffentlich, max. 5 MB)
- `avatars` (öffentlich, max. 2 MB)

Speicherstruktur: `{user_id}/{filename}`

## 4. Auth konfigurieren

Unter **Authentication → Providers**:

- **Email** aktivieren (Standard)
- Optional: **Confirm email** deaktivieren für schnellere Entwicklung

Unter **Authentication → URL Configuration**:

| Einstellung | Wert (Entwicklung) |
|-------------|-------------------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/**` |

Für Produktion die Vercel-URL eintragen.

## 5. E-Mail Templates (optional)

Unter **Authentication → Email Templates** die deutschen Texte anpassen:

- Confirm signup
- Reset password
- Magic Link

## 6. Tabellenübersicht

| Tabelle | Zweck |
|---------|-------|
| `profiles` | Nutzerprofile (Anzeigename, Avatar) |
| `recipes` | Rezepte mit Metadaten |
| `recipe_categories` | Vordefinierte Kategorien |
| `custom_categories` | Eigene Kategorien pro Nutzer |
| `recipe_tags` | Freie Tags |
| `recipe_ingredients` | Zutaten mit Mengen |
| `recipe_steps` | Zubereitungsschritte |
| `recipe_ratings` | 1–5 Sterne Bewertungen |
| `recipe_comments` | Kommentare |
| `recipe_favorites` | Favoriten |
| `recipe_variants` | Rezeptvarianten |
| `meal_plans` | Wochenpläne |
| `meal_plan_entries` | Rezepte pro Tag |
| `shopping_lists` | Einkaufslisten |
| `shopping_list_items` | Listeneinträge mit Checkbox |

## 7. Verifizierung

Nach Setup testen:

1. Registrierung → Profil wird automatisch erstellt
2. Rezept anlegen → erscheint unter „Meine Rezepte“
3. Bild hochladen → erscheint in Storage Bucket
4. Öffentliches Rezept → erreichbar unter `/recipe/{slug}`
