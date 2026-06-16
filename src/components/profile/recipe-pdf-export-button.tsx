"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecipesForPdfExport } from "@/lib/actions/recipe-export";
import { downloadRecipesPdf } from "@/lib/pdf/recipe-pdf";
import { toast } from "sonner";

interface RecipePdfExportButtonProps {
  userName: string;
}

export function RecipePdfExportButton({ userName }: RecipePdfExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const recipes = await getRecipesForPdfExport();
      if (recipes.length === 0) {
        toast.error("Keine Rezepte zum Exportieren vorhanden");
        return;
      }
      await downloadRecipesPdf(recipes, userName);
      toast.success("PDF heruntergeladen");
    } catch {
      toast.error("Fehler beim Exportieren — bitte erneut versuchen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileDown className="h-4 w-4 text-primary" />
          PDF-Backup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Alle deine Rezepte als schön gestaltete PDF herunterladen — ohne Fotos, ideal
          zum Ausdrucken oder Archivieren.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={handleExport}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              PDF wird erstellt…
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Rezepte als PDF exportieren
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
