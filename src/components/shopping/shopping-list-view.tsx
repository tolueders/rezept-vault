"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleShoppingItem, deleteShoppingList } from "@/lib/actions/meal-plan";
import { formatAmount } from "@/lib/recipe-utils";
import type { ShoppingList, ShoppingListItem } from "@/types/database";
import { toast } from "sonner";

interface ShoppingListViewProps {
  lists: (ShoppingList & { items: ShoppingListItem[] })[];
  activeListId?: string;
}

export function ShoppingListView({ lists, activeListId }: ShoppingListViewProps) {
  const router = useRouter();
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

  if (!activeList) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">
          Noch keine Einkaufsliste. Erstelle eine aus dem Wochenplan.
        </p>
        <Button className="mt-4" onClick={() => router.push("/meal-plan")}>
          Zum Wochenplan
        </Button>
      </div>
    );
  }

  const checkedCount = activeList.items.filter((i) => i.checked).length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Einkaufsliste</h1>
          <p className="mt-1 text-muted-foreground">
            {checkedCount} von {activeList.items.length} erledigt
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDeleteList(activeList.id)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Löschen
        </Button>
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
              Keine Einträge
            </p>
          ) : (
            activeList.items
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 hover:bg-secondary/50"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(checked) =>
                      handleToggle(item.id, checked === true)
                    }
                  />
                  <span
                    className={`flex-1 ${item.checked ? "text-muted-foreground line-through" : ""}`}
                  >
                    {item.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatAmount(item.amount, item.unit)}
                  </span>
                </label>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
