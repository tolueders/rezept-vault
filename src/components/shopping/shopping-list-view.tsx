"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  CalendarDays,
  Loader2,
  ShoppingCart,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  toggleShoppingItem,
  toggleShoppingItems,
  addShoppingListItem,
  removeShoppingListItem,
  importPlanIngredientsForDates,
  finishShoppingTrip,
  clearShoppingList,
} from "@/lib/actions/meal-plan";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatAmount } from "@/lib/recipe-utils";
import {
  countPlannedRecipesOnDates,
  getSelectableDays,
  isMergedItemChecked,
  mergeItemsForShop,
  type SelectableDay,
} from "@/lib/shopping-utils";
import type { ShoppingList, ShoppingListItem } from "@/types/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlanEntry {
  meal_plan_id: string;
  day_of_week: number;
}

interface ShoppingListViewProps {
  planList: (ShoppingList & { items: ShoppingListItem[] }) | null;
  extrasList: (ShoppingList & { items: ShoppingListItem[] }) | null;
  planEntries: PlanEntry[];
  planWeekStarts: Record<string, string>;
  shopMode?: boolean;
}

function ItemRow({
  item,
  onToggle,
  onRemove,
}: {
  item: ShoppingListItem;
  onToggle: (id: string, checked: boolean) => void;
  onRemove: (id: string, name: string) => void;
}) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-lg px-2 py-2 sm:px-3 sm:py-3">
      <Checkbox
        checked={item.checked}
        onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        className="h-5 w-5"
      />
      <label className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center gap-3 py-1">
        <span
          className={cn(
            "min-w-0 flex-1 text-base",
            item.checked && "text-muted-foreground line-through"
          )}
        >
          {item.name}
        </span>
        <span className="shrink-0 text-sm text-muted-foreground">
          {formatAmount(item.amount, item.unit)}
        </span>
      </label>
      <button
        onClick={() => onRemove(item.id, item.name)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
        aria-label="Entfernen"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function DayChip({
  day,
  selected,
  recipeCount,
  onClick,
}: {
  day: SelectableDay;
  selected: boolean;
  recipeCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-center rounded-xl py-2 text-center transition-colors",
        selected
          ? "bg-primary/10 ring-1 ring-primary/25 text-primary"
          : "bg-secondary/40 hover:bg-secondary/70",
        day.isToday && !selected && "ring-1 ring-primary/20"
      )}
    >
      <span className="text-[10px] font-medium uppercase text-muted-foreground">
        {day.weekday}
      </span>
      <span className="mt-0.5 text-sm font-semibold leading-none">
        {day.label.replace(".", "")}
      </span>
      {day.isToday && (
        <span className="mt-0.5 text-[9px] font-medium uppercase">Heute</span>
      )}
      {recipeCount > 0 && (
        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      )}
    </button>
  );
}

export function ShoppingListView({
  planList,
  extrasList,
  planEntries,
  planWeekStarts,
  shopMode = false,
}: ShoppingListViewProps) {
  const router = useRouter();
  const selectableDays = useMemo(() => getSelectableDays(), []);

  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    selectableDays.slice(0, 3).forEach((d) => initial.add(d.date));
    return initial;
  });

  const [newExtraName, setNewExtraName] = useState("");
  const [addingExtra, setAddingExtra] = useState(false);
  const [importingPlan, setImportingPlan] = useState(false);
  const [finishingShop, setFinishingShop] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<
    | { kind: "clear-plan" }
    | { kind: "clear-extras" }
    | { kind: "item"; id: string; name: string }
    | { kind: "finish-shop"; checkedCount: number; uncheckedCount: number }
    | null
  >(null);

  const planWeekMap = useMemo(
    () => new Map(Object.entries(planWeekStarts)),
    [planWeekStarts]
  );

  const recipeCountForDates = (dates: Set<string>) =>
    countPlannedRecipesOnDates(planEntries, planWeekMap, dates);

  const selectedRecipeCount = recipeCountForDates(selectedDates);

  const allItems = useMemo(
    () => [...(planList?.items ?? []), ...(extrasList?.items ?? [])],
    [planList?.items, extrasList?.items]
  );

  const mergedShopItems = useMemo(
    () => mergeItemsForShop(allItems),
    [allItems]
  );

  const checkedShopCount = mergedShopItems.filter(isMergedItemChecked).length;
  const totalShopCount = mergedShopItems.length;

  function toggleDate(date: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        if (next.size > 1) next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  async function handleToggle(itemId: string, checked: boolean) {
    await toggleShoppingItem(itemId, checked);
    router.refresh();
  }

  async function handleToggleMerged(sourceIds: string[], checked: boolean) {
    await toggleShoppingItems(sourceIds, checked);
    router.refresh();
  }

  async function handleAddExtra() {
    if (!extrasList || !newExtraName.trim()) return;
    setAddingExtra(true);
    try {
      await addShoppingListItem(extrasList.id, newExtraName.trim());
      setNewExtraName("");
      toast.success("Hinzugefügt");
      router.refresh();
    } catch {
      toast.error("Fehler beim Hinzufügen");
    } finally {
      setAddingExtra(false);
    }
  }

  async function handleImportPlan() {
    if (selectedDates.size === 0) return;
    setImportingPlan(true);
    try {
      const result = await importPlanIngredientsForDates([...selectedDates]);
      toast.success(
        `${result.count} Zutaten aus ${result.recipes} ${result.recipes === 1 ? "Rezept" : "Rezepten"} übernommen`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Importieren");
    } finally {
      setImportingPlan(false);
    }
  }

  async function confirmAction() {
    if (!confirmTarget) return;

    if (confirmTarget.kind === "item") {
      await removeShoppingListItem(confirmTarget.id);
      toast.success("Entfernt");
      router.refresh();
    } else if (confirmTarget.kind === "clear-plan" && planList) {
      await clearShoppingList(planList.id);
      toast.success("Wochenplan-Zutaten geleert");
      router.refresh();
    } else if (confirmTarget.kind === "clear-extras" && extrasList) {
      await clearShoppingList(extrasList.id);
      toast.success("Weitere Zutaten geleert");
      router.refresh();
    } else if (confirmTarget.kind === "finish-shop") {
      setFinishingShop(true);
      try {
        const checkedIds = mergedShopItems
          .filter(isMergedItemChecked)
          .flatMap((item) => item.sources.map((s) => s.itemId));

        const { removed } = await finishShoppingTrip(checkedIds);
        toast.success(
          removed > 0
            ? `${removed} ${removed === 1 ? "Zutat" : "Zutaten"} abgehakt und entfernt`
            : "Einkauf beendet"
        );
        router.push("/shopping-list");
        router.refresh();
      } catch {
        toast.error("Fehler beim Abschließen");
      } finally {
        setFinishingShop(false);
      }
    }
  }

  if (shopMode) {
    return (
      <div className="page-content">
        <header className="page-header !mb-0">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            onClick={() => router.push("/shopping-list")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Zurück
          </Button>
          <h1 className="page-title">Jetzt einkaufen</h1>
          <p className="page-subtitle">
            {checkedShopCount} von {totalShopCount} im Wagen
          </p>
        </header>

        {totalShopCount === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="space-y-4 py-10 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Noch keine Zutaten auf der Liste.
              </p>
              <Button variant="outline" onClick={() => router.push("/shopping-list")}>
                Zutaten hinzufügen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-border/50 shadow-sm md:mb-0">
              <CardContent className="space-y-1 pt-5 pb-36 md:pb-5">
                {mergedShopItems.map((item) => {
                  const checked = isMergedItemChecked(item);
                  const sourceIds = item.sources.map((s) => s.itemId);
                  return (
                    <div
                      key={item.key}
                      className="flex min-h-14 items-center gap-2 rounded-lg px-2 py-2 sm:px-3"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          handleToggleMerged(sourceIds, value === true)
                        }
                        className="h-6 w-6"
                      />
                      <label className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 py-1">
                        <span
                          className={cn(
                            "min-w-0 flex-1 text-base sm:text-lg",
                            checked && "text-muted-foreground line-through"
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {formatAmount(item.amount, item.unit)}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="shop-action-bar shop-action-bar--docked space-y-2 md:space-y-3">
              <Button
                className="mx-auto h-12 w-full max-w-7xl text-base"
                size="lg"
                disabled={finishingShop}
                onClick={() =>
                  setConfirmTarget({
                    kind: "finish-shop",
                    checkedCount: checkedShopCount,
                    uncheckedCount: totalShopCount - checkedShopCount,
                  })
                }
              >
                {finishingShop ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                Einkauf abschließen
              </Button>
              {totalShopCount - checkedShopCount > 0 && (
                <p className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
                  Nicht abgehakte Zutaten bleiben auf deinen Listen.
                </p>
              )}
            </div>
          </>
        )}

        <ConfirmDialog
          open={!!confirmTarget}
          onOpenChange={(open) => !open && setConfirmTarget(null)}
          title="Einkauf abschließen?"
          description={
            confirmTarget?.kind === "finish-shop" ? (
              confirmTarget.checkedCount > 0 ? (
                <>
                  {confirmTarget.checkedCount}{" "}
                  {confirmTarget.checkedCount === 1
                    ? "Zutat wird"
                    : "Zutaten werden"}{" "}
                  von der Liste entfernt.
                  {confirmTarget.uncheckedCount > 0 && (
                    <>
                      {" "}
                      {confirmTarget.uncheckedCount}{" "}
                      {confirmTarget.uncheckedCount === 1
                        ? "fehlende Zutat bleibt"
                        : "fehlende Zutaten bleiben"}{" "}
                      erhalten.
                    </>
                  )}
                </>
              ) : (
                <>Es wurden noch keine Zutaten abgehakt.</>
              )
            ) : null
          }
          confirmLabel="Abschließen"
          onConfirm={confirmAction}
        />
      </div>
    );
  }

  return (
    <div className="page-content">
      <header className="page-header !mb-0">
        <h1 className="page-title">Einkaufsliste</h1>
        <p className="page-subtitle">
          Zutaten aus dem Wochenplan und eigene Ergänzungen
        </p>
      </header>

      <Button
        className="h-12 w-full text-base"
        size="lg"
        disabled={allItems.length === 0}
        onClick={() => router.push("/shopping-list?mode=shop")}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Jetzt einkaufen
        {allItems.length > 0 && (
          <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-sm">
            {allItems.length}
          </span>
        )}
      </Button>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Aus Wochenplan übernehmen</CardTitle>
              <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                Nur heute und kommende Tage (max. 1 Woche)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-1.5">
            {selectableDays.map((day) => (
              <DayChip
                key={day.date}
                day={day}
                selected={selectedDates.has(day.date)}
                recipeCount={recipeCountForDates(new Set([day.date]))}
                onClick={() => toggleDate(day.date)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedRecipeCount > 0
                ? `${selectedRecipeCount} ${selectedRecipeCount === 1 ? "Rezept" : "Rezepte"} an ${selectedDates.size} ${selectedDates.size === 1 ? "Tag" : "Tagen"}`
                : "Keine Rezepte an den gewählten Tagen geplant"}
            </p>
            <Button
              variant="outline"
              className="w-full shrink-0 sm:w-auto"
              disabled={importingPlan || selectedRecipeCount === 0}
              onClick={handleImportPlan}
            >
              {importingPlan ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Zutaten übernehmen
            </Button>
          </div>

          {planList && (
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{planList.title}</p>
                {planList.items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground"
                    onClick={() => setConfirmTarget({ kind: "clear-plan" })}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Leeren
                  </Button>
                )}
              </div>
              {planList.items.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Noch keine Zutaten — wähle Tage und übernimm sie aus dem Plan
                </p>
              ) : (
                planList.items
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onRemove={(id, name) =>
                        setConfirmTarget({ kind: "item", id, name })
                      }
                    />
                  ))
              )}
            </div>
          )}

          {!planList && (
            <p className="text-sm text-muted-foreground">
              <Link href="/meal-plan" className="text-primary underline-offset-4 hover:underline">
                Wochenplanung
              </Link>{" "}
              öffnen und Rezepte planen.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {extrasList?.title ?? "Weitere Zutaten"}
            </CardTitle>
            {extrasList && extrasList.items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground"
                onClick={() => setConfirmTarget({ kind: "clear-extras" })}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Leeren
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {extrasList?.items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Milch, Haushaltswaren oder andere Dinge, die nicht im Plan stehen
            </p>
          )}

          {extrasList?.items
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onRemove={(id, name) =>
                  setConfirmTarget({ kind: "item", id, name })
                }
              />
            ))}

          <div className="flex gap-2 border-t border-border pt-4">
            <Input
              placeholder="Weitere Zutat hinzufügen…"
              value={newExtraName}
              onChange={(e) => setNewExtraName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddExtra()}
              disabled={!extrasList}
            />
            <Button
              onClick={handleAddExtra}
              disabled={addingExtra || !newExtraName.trim() || !extrasList}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={
          confirmTarget?.kind === "clear-plan"
            ? "Wochenplan-Zutaten leeren?"
            : confirmTarget?.kind === "clear-extras"
              ? "Weitere Zutaten leeren?"
              : "Zutat entfernen?"
        }
        description={
          confirmTarget?.kind === "clear-plan" ? (
            <>Alle Zutaten aus dem Wochenplan werden von der Liste entfernt.</>
          ) : confirmTarget?.kind === "clear-extras" ? (
            <>Alle weiteren Zutaten werden von der Liste entfernt.</>
          ) : confirmTarget?.kind === "item" ? (
            <>
              „{confirmTarget.name}“ wird von der Liste entfernt.
            </>
          ) : null
        }
        confirmLabel={
          confirmTarget?.kind === "item" ? "Entfernen" : "Leeren"
        }
        onConfirm={confirmAction}
      />
    </div>
  );
}
