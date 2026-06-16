"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  addMealPlanEntry,
  removeMealPlanEntry,
} from "@/lib/actions/meal-plan";
import { WEEKDAYS, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/constants";
import { formatWeekRange } from "@/lib/recipe-utils";
import type { MealPlanEntry, MealType, Recipe } from "@/types/database";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import Link from "next/link";
import { addDays, format, isSameDay, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WEEKDAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

const MEAL_TYPE_STYLES: Record<MealType, string> = {
  fruehstueck: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  mittagessen: "bg-sky-500/10 text-sky-800 dark:text-sky-200",
  abendessen: "bg-primary/10 text-primary",
  snack: "bg-violet-500/10 text-violet-800 dark:text-violet-200",
};

interface MealPlanViewProps {
  mealPlanId: string;
  weekStart: string;
  entries: (MealPlanEntry & { recipe?: Recipe })[];
  userRecipes: Recipe[];
}

export function MealPlanView({
  mealPlanId,
  weekStart,
  entries,
  userRecipes,
}: MealPlanViewProps) {
  const router = useRouter();
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<MealType>("abendessen");
  const [loading, setLoading] = useState(false);
  const [entryToRemove, setEntryToRemove] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const mealTypeItems = useMemo(
    () =>
      MEAL_TYPE_ORDER.map((type) => ({
        label: MEAL_TYPE_LABELS[type],
        value: type,
      })),
    []
  );

  const recipeItems = useMemo(
    () => userRecipes.map((r) => ({ label: r.title, value: r.id })),
    [userRecipes]
  );

  const startDate = parseISO(weekStart);
  const today = new Date();

  function scrollToDay(index: number) {
    setHighlightedDay(index);
    dayRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => setHighlightedDay(null), 1800);
  }

  function openAddForm(index: number) {
    setSelectedRecipe("");
    setSelectedMealType("abendessen");
    setAddingDay(index);
    scrollToDay(index);
  }

  function navigateWeek(offset: number) {
    const newStart = addDays(startDate, offset * 7);
    router.push(`/meal-plan?week=${format(newStart, "yyyy-MM-dd")}`);
  }

  function sortEntries(dayEntries: typeof entries) {
    return [...dayEntries].sort((a, b) => {
      const typeOrder =
        MEAL_TYPE_ORDER.indexOf(a.meal_type) -
        MEAL_TYPE_ORDER.indexOf(b.meal_type);
      return typeOrder !== 0 ? typeOrder : a.sort_order - b.sort_order;
    });
  }

  async function handleAddEntry(dayOfWeek: number) {
    if (!selectedRecipe) return;
    setLoading(true);
    try {
      await addMealPlanEntry(
        mealPlanId,
        dayOfWeek,
        selectedRecipe,
        selectedMealType
      );
      setAddingDay(null);
      setSelectedRecipe("");
      setSelectedMealType("abendessen");
      toast.success("Rezept hinzugefügt");
      router.refresh();
    } catch {
      toast.error("Fehler beim Hinzufügen");
    } finally {
      setLoading(false);
    }
  }

  async function confirmRemoveEntry() {
    if (!entryToRemove) return;
    await removeMealPlanEntry(entryToRemove.id);
    toast.success("Entfernt");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <header className="page-header !mb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Wochenplanung</h1>
            <p className="page-subtitle">{formatWeekRange(startDate)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border/50 bg-card p-1 shadow-sm">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden px-3 text-xs sm:inline-flex"
              onClick={() => router.push("/meal-plan")}
            >
              Diese Woche
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {entries.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? "Mahlzeit" : "Mahlzeiten"} geplant
        </p>
      )}

      {/* Wochenleiste – antippen scrollt zum Tag */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((_, index) => {
          const dayDate = addDays(startDate, index);
          const isToday = isSameDay(dayDate, today);
          const isHighlighted = highlightedDay === index;
          const count = entries.filter((e) => e.day_of_week === index).length;
          return (
            <button
              key={index}
              type="button"
              onClick={() => scrollToDay(index)}
              className={cn(
                "flex flex-col items-center rounded-xl py-2.5 text-center transition-colors",
                isHighlighted && "bg-primary/15 ring-2 ring-primary/30",
                !isHighlighted && isToday && "bg-primary/10 ring-1 ring-primary/25",
                !isHighlighted && !isToday && "bg-secondary/40 hover:bg-secondary/70"
              )}
            >
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                {WEEKDAY_SHORT[index]}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-sm font-semibold",
                  (isToday || isHighlighted) && "text-primary"
                )}
              >
                {format(dayDate, "d")}
              </span>
              {count > 0 && (
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Wochenansicht */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {WEEKDAYS.map((day, index) => {
          const dayEntries = sortEntries(
            entries.filter((e) => e.day_of_week === index)
          );
          const dayDate = addDays(startDate, index);
          const isToday = isSameDay(dayDate, today);

          return (
            <div
              key={day}
              ref={(el) => {
                dayRefs.current[index] = el;
              }}
              id={`meal-day-${index}`}
              className={cn(
                "scroll-mt-24 flex min-h-[180px] flex-col rounded-2xl border bg-card shadow-sm transition-shadow",
                isToday
                  ? "border-primary/40 ring-2 ring-primary/15"
                  : "border-border/50",
                highlightedDay === index && "ring-2 ring-primary/35"
              )}
            >
              <div
                className={cn(
                  "flex items-baseline justify-between gap-2 border-b px-3 py-2.5",
                  isToday ? "border-primary/20 bg-primary/5" : "border-border/40"
                )}
              >
                <div>
                  <p className="text-sm font-semibold leading-none">{day}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(dayDate, "d. MMMM", { locale: de })}
                  </p>
                </div>
                {isToday && (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    Heute
                  </Badge>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-3">
                {dayEntries.length === 0 && addingDay !== index && (
                  <p className="flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
                    Noch nichts geplant
                  </p>
                )}

                {dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="group flex items-start gap-2 rounded-xl bg-secondary/40 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "mb-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          MEAL_TYPE_STYLES[entry.meal_type as MealType]
                        )}
                      >
                        {MEAL_TYPE_LABELS[entry.meal_type as MealType]}
                      </span>
                      <Link
                        href={`/recipes/${entry.recipe_id}`}
                        className="block truncate text-sm font-medium leading-snug hover:text-primary"
                      >
                        {entry.recipe?.title || "Rezept"}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEntryToRemove({
                          id: entry.id,
                          title: entry.recipe?.title || "Rezept",
                        })
                      }
                      className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-background hover:text-destructive group-hover:opacity-100"
                      aria-label="Entfernen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {addingDay === index ? (
                  <div className="space-y-3 rounded-xl border border-dashed border-border/60 bg-secondary/20 p-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Mahlzeit</p>
                      <Select
                        value={selectedMealType}
                        onValueChange={(v) =>
                          setSelectedMealType((v as MealType) ?? "abendessen")
                        }
                        items={mealTypeItems}
                      >
                        <SelectTrigger className="h-10 w-full text-sm">
                          <SelectValue placeholder="Mahlzeit wählen" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false} className="max-h-60">
                          {MEAL_TYPE_ORDER.map((type) => (
                            <SelectItem key={type} value={type}>
                              {MEAL_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Rezept</p>
                      <Select
                        value={selectedRecipe}
                        onValueChange={(v) => setSelectedRecipe(v ?? "")}
                        items={recipeItems}
                      >
                        <SelectTrigger className="h-10 w-full text-sm">
                          <SelectValue placeholder="Rezept wählen" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false} className="max-h-60">
                          {userRecipes.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddEntry(index)}
                        disabled={loading || !selectedRecipe}
                      >
                        Hinzufügen
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAddingDay(null)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-auto w-full text-muted-foreground hover:text-foreground"
                    onClick={() => openAddForm(index)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Rezept planen
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!entryToRemove}
        onOpenChange={(open) => !open && setEntryToRemove(null)}
        title="Mahlzeit entfernen?"
        description={
          <>
            „{entryToRemove?.title}“ wird aus dem Wochenplan entfernt.
          </>
        }
        confirmLabel="Entfernen"
        onConfirm={confirmRemoveEntry}
      />
    </div>
  );
}
