"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitBranch, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setPreferredVariant } from "@/lib/actions/recipes";
import { toast } from "sonner";

interface VariantRow {
  id: string;
  variant_name: string;
  is_preferred: boolean;
  variant_recipe_id: string;
  variant?: { id: string; title: string } | null;
}

interface RecipeVariantsProps {
  variants: VariantRow[];
  originalId: string;
}

export function RecipeVariants({ variants, originalId }: RecipeVariantsProps) {
  const router = useRouter();

  if (variants.length === 0) {
    return (
      <section className="mb-8 rounded-xl border border-border/60 bg-secondary/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Varianten</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Erstelle angepasste Versionen dieses Rezepts (z. B. vegan, ohne Gluten).
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/recipes/${originalId}/variant`}>Neue Variante erstellen</Link>
        </Button>
      </section>
    );
  }

  async function handleSetPreferred(variantRecipeId: string) {
    await setPreferredVariant(variantRecipeId, originalId);
    toast.success("Bevorzugte Variante gesetzt");
    router.refresh();
  }

  return (
    <section className="mb-8 rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Varianten</h2>
      </div>
      <ul className="space-y-2">
        {variants.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Link
                href={`/recipes/${v.variant_recipe_id}`}
                className="font-medium hover:text-primary hover:underline"
              >
                {v.variant_name}
              </Link>
              {v.is_preferred && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  Bevorzugt
                </Badge>
              )}
            </div>
            {!v.is_preferred && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetPreferred(v.variant_recipe_id)}
              >
                Als bevorzugt setzen
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-3" asChild>
        <Link href={`/recipes/${originalId}/variant`}>Neue Variante erstellen</Link>
      </Button>
    </section>
  );
}
