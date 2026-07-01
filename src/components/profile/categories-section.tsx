"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createCustomCategory,
  deleteCustomCategory,
  migrateStandardCategoryRecipes,
  migrateRecipesToCategory,
  resetStandardCategoryOverride,
  updateCustomCategory,
  upsertStandardCategoryOverride,
} from "@/lib/actions/categories";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { UserCategoryView } from "@/types/database";
import { toast } from "sonner";

interface CategoriesSectionProps {
  categories: UserCategoryView[];
}

type DialogMode = "edit" | "migrate" | "delete" | null;

export function CategoriesSection({
  categories: initial,
}: CategoriesSectionProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<UserCategoryView | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editName, setEditName] = useState("");
  const [targetFilterKey, setTargetFilterKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCategories(initial);
  }, [initial]);

  const migrationTargets = useMemo(() => {
    if (!activeCategory) return [];
    return categories.filter((cat) => cat.filterKey !== activeCategory.filterKey);
  }, [activeCategory, categories]);

  function openEdit(category: UserCategoryView) {
    setActiveCategory(category);
    setEditName(category.name);
    setDialogMode("edit");
  }

  function openMigrate(category: UserCategoryView) {
    setActiveCategory(category);
    setTargetFilterKey(migrationTargets[0]?.filterKey ?? "");
    setDialogMode("migrate");
  }

  function openDelete(category: UserCategoryView) {
    setActiveCategory(category);
    setTargetFilterKey(migrationTargets[0]?.filterKey ?? "");
    setDialogMode("delete");
  }

  function closeDialog() {
    setDialogMode(null);
    setActiveCategory(null);
    setEditName("");
    setTargetFilterKey("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createCustomCategory(newName);
      setNewName("");
      toast.success("Kategorie erstellt");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit() {
    if (!activeCategory) return;
    setSaving(true);
    try {
      if (activeCategory.isCustom && activeCategory.customCategoryId) {
        await updateCustomCategory(activeCategory.customCategoryId, editName);
      } else if (activeCategory.standardCategoryId) {
        if (
          activeCategory.defaultName &&
          editName.trim() === activeCategory.defaultName
        ) {
          await resetStandardCategoryOverride(activeCategory.standardCategoryId);
        } else {
          await upsertStandardCategoryOverride(
            activeCategory.standardCategoryId,
            editName
          );
        }
      }
      toast.success("Kategorie gespeichert");
      closeDialog();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function handleMigrate() {
    if (!activeCategory || !targetFilterKey) return;
    setSaving(true);
    try {
      if (activeCategory.isCustom && activeCategory.customCategoryId) {
        await migrateRecipesToCategory(
          activeCategory.customCategoryId,
          targetFilterKey
        );
      } else if (activeCategory.standardCategoryId) {
        await migrateStandardCategoryRecipes(
          activeCategory.standardCategoryId,
          targetFilterKey
        );
      }
      toast.success("Rezepte verschoben");
      closeDialog();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Verschieben");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteCategory() {
    if (!activeCategory?.customCategoryId) return;
    setSaving(true);
    try {
      await deleteCustomCategory(
        activeCategory.customCategoryId,
        activeCategory.recipeCount > 0 ? targetFilterKey : undefined
      );
      setCategories((prev) =>
        prev.filter((cat) => cat.filterKey !== activeCategory.filterKey)
      );
      toast.success("Kategorie gelöscht");
      closeDialog();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Löschen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Kategorien</CardTitle>
        <p className="text-sm text-muted-foreground">
          Standard-Kategorien kannst du umbenennen. Eigene Kategorien kannst du
          hinzufügen und löschen — Rezepte werden dabei in eine andere Kategorie
          überführt.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li
              key={cat.filterKey}
              className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.recipeCount}{" "}
                  {cat.recipeCount === 1 ? "Rezept" : "Rezepte"}
                  {cat.isCustom ? " · eigen" : " · Standard"}
                  {!cat.isCustom &&
                    cat.defaultName &&
                    cat.name !== cat.defaultName && (
                      <span> · Standard: {cat.defaultName}</span>
                    )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {cat.recipeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => openMigrate(cat)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                    aria-label="Rezepte verschieben"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label="Bearbeiten"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {cat.canDelete && (
                  <button
                    type="button"
                    onClick={() => openDelete(cat)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-destructive"
                    aria-label="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            placeholder="Neue Kategorie…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={creating}
          />
          <Button type="submit" disabled={creating || !newName.trim()}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>

      <Dialog open={dialogMode === "edit"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kategorie bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={saving}
              />
              {activeCategory?.defaultName && !activeCategory.isCustom && (
                <p className="text-xs text-muted-foreground">
                  Standardname: {activeCategory.defaultName}
                </p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleSaveEdit}
              disabled={saving || editName.trim().length < 2}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMode === "migrate"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rezepte verschieben</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Alle {activeCategory?.recipeCount} Rezepte aus „{activeCategory?.name}“
            in eine andere Kategorie überführen.
          </p>
          <TargetCategorySelect
            categories={migrationTargets}
            value={targetFilterKey}
            onChange={setTargetFilterKey}
          />
          <Button
            className="w-full"
            onClick={handleMigrate}
            disabled={saving || !targetFilterKey}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rezepte verschieben
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={dialogMode === "delete"}
        onOpenChange={(open) => !open && closeDialog()}
        title="Kategorie löschen?"
        description={
          activeCategory && activeCategory.recipeCount > 0 ? (
            <div className="space-y-3 text-left">
              <p>
                „{activeCategory.name}“ wird gelöscht. Wähle, wohin die{" "}
                {activeCategory.recipeCount} Rezepte verschoben werden sollen.
              </p>
              <TargetCategorySelect
                categories={migrationTargets}
                value={targetFilterKey}
                onChange={setTargetFilterKey}
              />
            </div>
          ) : (
            <>„{activeCategory?.name}“ wird gelöscht.</>
          )
        }
        onConfirm={confirmDeleteCategory}
      />
    </Card>
  );
}

function TargetCategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: UserCategoryView[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Ziel-Kategorie</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Kategorie wählen" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.filterKey} value={cat.filterKey}>
              {cat.name}
              {cat.isCustom && " (eigen)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
