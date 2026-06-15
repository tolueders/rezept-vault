# Gemini Setup – Rezept-Erkennung per Foto

RezeptVault nutzt die **Google Gemini Vision API**, um Rezeptfotos zu analysieren und automatisch Titel, Zutaten und Schritte zu extrahieren.

## 1. API Key erstellen

1. Gehe zu [Google AI Studio](https://aistudio.google.com/apikey)
2. Melde dich mit deinem Google-Konto an
3. Klicke **Create API Key**
4. Kopiere den Key

## 2. Umgebungsvariable setzen

In `.env.local`:

```env
GEMINI_API_KEY=dein-api-key-hier
```

> Der Key wird **nur serverseitig** verwendet (`/api/analyze-recipe`). Er erscheint nicht im Frontend.

## 3. Verwendetes Modell

- Modell: `gemini-2.0-flash`
- Eingabe: Base64-kodiertes Bild (JPEG, PNG, WebP)
- Ausgabe: JSON mit Rezeptstruktur

## 4. Ablauf in der App

1. Nutzer wählt „Foto-Upload“ beim Rezept erstellen
2. Bild wird clientseitig komprimiert
3. API-Route `/api/analyze-recipe` sendet Bild an Gemini
4. Extrahierte Daten füllen das Formular vor
5. Nutzer prüft und bearbeitet vor dem Speichern

## 5. Kosten & Limits

- Gemini Flash hat ein großzügiges Free Tier
- Aktuelle Preise: [ai.google.dev/pricing](https://ai.google.dev/pricing)
- Für Produktion: API-Nutzung im Google Cloud Dashboard überwachen

## 6. Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| „GEMINI_API_KEY ist nicht konfiguriert“ | `.env.local` prüfen, Server neu starten |
| „Rezept konnte nicht analysiert werden“ | Bildqualität prüfen, API-Key-Gültigkeit testen |
| Ungenaue Extraktion | Nutzer kann alle Felder manuell korrigieren |

## 7. Datenschutz

- Bilder werden nur für die Analyse an Google gesendet
- Keine dauerhafte Speicherung bei Google (gemäß Gemini API Nutzungsbedingungen)
- Gespeicherte Rezeptbilder liegen ausschließlich in Supabase Storage
