"use client";

import {
  Camera,
  FileText,
  Link2,
  Loader2,
  PenLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RecipePhotoScanner } from "@/components/recipes/recipe-photo-scanner";
import { cn } from "@/lib/utils";

export type ImportMode = "manual" | "text" | "photo" | "url";

const IMPORT_MODES: {
  id: ImportMode;
  label: string;
  hint: string;
  icon: typeof PenLine;
}[] = [
  { id: "manual", label: "Manuell", hint: "Selbst eintragen", icon: PenLine },
  { id: "text", label: "Text", hint: "Rezept einfügen", icon: FileText },
  { id: "photo", label: "Foto", hint: "Bis zu 3 Fotos", icon: Camera },
  { id: "url", label: "Link", hint: "Von Webseite", icon: Link2 },
];

interface RecipeImportPanelProps {
  mode: ImportMode;
  onModeChange: (mode: ImportMode) => void;
  analyzing: boolean;
  importText: string;
  onImportTextChange: (text: string) => void;
  onTextImport: () => void;
  importUrl: string;
  onImportUrlChange: (url: string) => void;
  onUrlImport: () => void;
  photoAnalyzed: boolean;
  onPhotoAnalyze: (files: File[]) => void;
  onPhotoReset: () => void;
}

export function RecipeImportPanel({
  mode,
  onModeChange,
  analyzing,
  importText,
  onImportTextChange,
  onTextImport,
  importUrl,
  onImportUrlChange,
  onUrlImport,
  photoAnalyzed,
  onPhotoAnalyze,
  onPhotoReset,
}: RecipeImportPanelProps) {
  return (
    <section className="recipe-import-panel overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="border-b border-border/40 bg-gradient-to-br from-primary/[0.06] via-transparent to-secondary/30 px-4 py-4 md:px-6 md:py-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/80">
          Rezept hinzufügen
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          Wähle, wie du dein Rezept anlegen möchtest.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {IMPORT_MODES.map(({ id, label, hint, icon: Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onModeChange(id)}
                aria-pressed={active}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition-all duration-200",
                  active
                    ? "border-primary/40 bg-primary/[0.08] shadow-sm ring-2 ring-primary/15"
                    : "border-border/50 bg-background/80 hover:border-primary/25 hover:bg-secondary/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-none">{label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-5 md:px-6 md:py-6">
        {mode === "manual" && (
          <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-6 text-center">
            <PenLine className="mx-auto mb-3 h-8 w-8 text-primary/70" />
            <p className="text-sm font-medium">Manuell ausfüllen</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Trage Titel, Zutaten und Schritte unten ein — oder wähle oben Text, Foto
              oder Link für die KI-Unterstützung.
            </p>
          </div>
        )}

        {mode === "text" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:mb-0 sm:mr-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Rezepttext einfügen</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kopiere ein Rezept aus einem Buch, einer E-Mail oder einer Notiz —
                  die KI strukturiert es für dich.
                </p>
              </div>
            </div>
            <Textarea
              placeholder={`Beispiel:\n\nSpaghetti Carbonara\n\nZutaten für 4 Personen:\n400 g Spaghetti\n200 g Pancetta\n4 Eigelb\n...\n\nZubereitung:\n1. Nudeln kochen\n2. ...`}
              value={importText}
              onChange={(e) => onImportTextChange(e.target.value)}
              disabled={analyzing}
              rows={10}
              className="min-h-[200px] resize-y bg-background font-mono text-sm leading-relaxed"
            />
            <Button
              type="button"
              className="w-full"
              onClick={onTextImport}
              disabled={analyzing || importText.trim().length < 20}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird analysiert…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Rezept aus Text erstellen
                </>
              )}
            </Button>
          </div>
        )}

        {mode === "photo" && (
          <RecipePhotoScanner
            analyzing={analyzing}
            analyzed={photoAnalyzed}
            onAnalyze={onPhotoAnalyze}
            onReset={onPhotoReset}
          />
        )}

        {mode === "url" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:mb-0 sm:mr-4">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Von Webseite importieren</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Link zu einem Online-Rezept einfügen — Titel, Zutaten und
                  Zubereitung werden automatisch übernommen.
                </p>
              </div>
            </div>
            <Input
              type="url"
              placeholder="https://www.chefkoch.de/rezept/…"
              value={importUrl}
              onChange={(e) => onImportUrlChange(e.target.value)}
              disabled={analyzing}
              className="h-11"
            />
            <Button
              type="button"
              className="w-full"
              onClick={onUrlImport}
              disabled={analyzing || !importUrl.trim()}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Import läuft…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Rezept importieren
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
