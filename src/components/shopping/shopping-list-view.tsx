"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Share2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  toggleShoppingItem,
  deleteShoppingList,
  addShoppingListItem,
  removeShoppingListItem,
  createEmptyShoppingList,
} from "@/lib/actions/meal-plan";
import { formatAmount } from "@/lib/recipe-utils";
import { formatShoppingListText, shareOrCopy } from "@/lib/share-utils";
import type { ShoppingList, ShoppingListItem } from "@/types/database";
import { toast } from "sonner";

interface ShoppingListViewProps {
  lists: (ShoppingList & { items: ShoppingListItem[] })[];
  activeListId?: string;
}

export function ShoppingListView({ lists, activeListId }: ShoppingListViewProps) {
  const router = useRouter();
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);

  const activeList = activeListId
    ? lists.find((l) => l.id === activeListId) || lists[0]
    : lists[0];

  async function handleToggle(itemId: string, checked: boolean) {
    await toggleShoppingItem(itemId, checked);
    router.refresh();
  }

  async function handleDeleteList(listId: string) {
    if (!confirm("Einkaufsliste löschen?")) return;
    await deleteShoppingList(listId);
    toast.success("Liste gelöscht");
    router.push("/shopping-list");
    router.refresh();
  }

  async function handleRemoveItem(itemId: string) {
    await removeShoppingListItem(itemId);
    router.refresh();
  }

  async function handleAddItem() {
    if (!activeList || !newItemName.trim()) return;
    setAdding(true);
    try {
      await addShoppingListItem(activeList.id, newItemName.trim());
      setNewItemName("");
      toast.success("Hinzugefügt");
      router.refresh();
    } catch {
      toast.error("Fehler beim Hinzufügen");
    } finally {
      setAdding(false);
    }
  }

  async function handleCreateList() {
    setAdding(true);
    try {
      const list = await createEmptyShoppingList();
      toast.success("Neue Liste erstellt");
      router.push(`/shopping-list?id=${list.id}`);
      router.refresh();
    } catch {
      toast.error("Fehler beim Erstellen");
    } finally {
      setAdding(false);
    }
  }

  async function handleShareList() {
    if (!activeList) return;
    const text = formatShoppingListText(activeList.title, activeList.items);
    try {
      const result = await shareOrCopy({
        title: activeList.title,
        text,
      });
      toast.success(result === "shared" ? "Liste geteilt!" : "Liste kopiert!");
    } catch {
      // User cancelled
    }
  }

  if (!activeList) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          Noch keine Einkaufsliste. Erstelle eine aus dem Wochenplan oder manuell.
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => router.push("/meal-plan")}>
            Zum Wochenplan
          </Button>
          <Button variant="outline" onClick={handleCreateList} disabled={adding}>
            <Plus className="mr-1 h-4 w-4" />
            Leere Liste erstellen
          </Button>
        </div>
      </div>
    );
  }

  const checkedCount = activeList.items.filter((i) => i.checked).length;

  return (
    <div>
      <div className="mb-6 space-y-4 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Einkaufsliste</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {checkedCount} von {activeList.items.length} erledigt
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={handleShareList}
            disabled={activeList.items.length === 0}
          >
            <Share2 className="mr-1 h-4 w-4" />
            Teilen
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={handleCreateList}
            disabled={adding}
          >
            <Plus className="mr-1 h-4 w-4" />
            Neue Liste
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => handleDeleteList(activeList.id)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      {lists.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {lists.map((list) => (
            <Button
              key={list.id}
              variant={list.id === activeList.id ? "default" : "outline"}
              size="sm"
              onClick={() => router.push(`/shopping-list?id=${list.id}`)}
            >
              {list.title}
            </Button>
          ))}
        </div>
      )}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{activeList.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {activeList.items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Noch keine Einträge – füge unten etwas hinzu
            </p>
          ) : (
            activeList.items
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex min-h-12 items-center gap-2 rounded-lg px-2 py-2 sm:px-3 sm:py-3"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(checked) =>
                      handleToggle(item.id, checked === true)
                    }
                    className="h-5 w-5"
                  />
                  <label className="flex min-h-10 flex-1 cursor-pointer items-center gap-3 py-1">
                    <span
                      className={`flex-1 text-base ${item.checked ? "text-muted-foreground line-through" : ""}`}
                    >
                      {item.name}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatAmount(item.amount, item.unit)}
                    </span>
                  </label>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground"
                    aria-label="Entfernen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
          )}

          <div className="flex gap-2 border-t border-border pt-4">
            <Input
              placeholder="Zutat hinzufügen…"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            />
            <Button
              onClick={handleAddItem}
              disabled={adding || !newItemName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
