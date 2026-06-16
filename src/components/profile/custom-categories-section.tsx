"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCustomCategory,
  deleteCustomCategory,
} from "@/lib/actions/categories";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { CustomCategory } from "@/types/database";
import { toast } from "sonner";

interface CustomCategoriesSectionProps {
  categories: CustomCategory[];
}

export function CustomCategoriesSection({
  categories: initial,
}: CustomCategoriesSectionProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CustomCategory | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const created = await createCustomCategory(name);
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "de"))
      );
      setName("");
      toast.success("Kategorie erstellt");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;
    try {
      await deleteCustomCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      toast.success("Kategorie gelöscht");
      router.refresh();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Eigene Kategorien</CardTitle>
        <p className="text-sm text-muted-foreground">
          Persönliche Kategorien für deine Rezepte, z. B. „Omas Rezepte“.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {categories.length > 0 && (
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
              >
                <span className="text-sm font-medium">{cat.name}</span>
                <button
                  onClick={() => setCategoryToDelete(cat)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground"
                  aria-label="Löschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            placeholder="Neue Kategorie…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>

      <ConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Kategorie löschen?"
        description={
          <>
            „{categoryToDelete?.name}“ wird gelöscht. Rezepte behalten ihre Zuordnung
            zu dieser Kategorie nicht.
          </>
        }
        onConfirm={confirmDeleteCategory}
      />
    </Card>
  );
}
