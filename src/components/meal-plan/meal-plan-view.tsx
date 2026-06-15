"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addMealPlanEntry,
  removeMealPlanEntry,
  generateShoppingList,
} from "@/lib/actions/meal-plan";
import { WEEKDAYS, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/constants";
import { formatWeekRange } from "@/lib/recipe-utils";
import type { MealPlanEntry, MealType, Recipe } from "@/types/database";
import { toast } from "sonner";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

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

  const startDate = parseISO(weekStart);

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

  async function handleRemove(entryId: string) {
    await removeMealPlanEntry(entryId);
    toast.success("Entfernt");
    router.refresh();
  }

  async function handleGenerateList() {
    setLoading(true);
    try {
      const list = await generateShoppingList(mealPlanId);
      toast.success("Einkaufsliste aktualisiert");
      router.push(`/shopping-list?id=${list.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 space-y-4 sm:mb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Wochenplanung</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {formatWeekRange(startDate)}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={handleGenerateList}
          disabled={loading || entries.length === 0}
        >
          <ShoppingCart className="mr-1 h-4 w-4" />
          Einkaufsliste erstellen
        </Button>
      </div>

      <div className="meal-plan-scroll flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 lg:grid-cols-3 xl:grid-cols-4">
        {WEEKDAYS.map((day, index) => {
          const dayEntries = sortEntries(
            entries.filter((e) => e.day_of_week === index)
          );
          const dayDate = addDays(startDate, index);

          return (
            <Card key={day} className="w-[82vw] shrink-0 border-border/60 sm:w-[70vw] md:w-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {day}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {format(dayDate, "d. MMM", { locale: de })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <Badge variant="outline" className="mb-1 text-xs">
                        {MEAL_TYPE_LABELS[entry.meal_type]}
                      </Badge>
                      <Link
                        href={`/recipes/${entry.recipe_id}`}
                        className="block truncate text-sm font-medium hover:text-primary"
                      >
                        {entry.recipe?.title || "Rezept"}
                      </Link>
                    </div>
                    <button onClick={() => handleRemove(entry.id)}>
                      <X className="h-4 w-4 shrink-0 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}

                {addingDay === index ? (
                  <div className="space-y-2">
                    <Select
                      value={selectedMealType}
                      onValueChange={(v) =>
                        setSelectedMealType((v as MealType) ?? "abendessen")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mahlzeit" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TYPE_ORDER.map((type) => (
                          <SelectItem key={type} value={type}>
                            {MEAL_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedRecipe}
                      onValueChange={(v) => setSelectedRecipe(v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rezept wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRecipes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
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
                    className="w-full"
                    onClick={() => setAddingDay(index)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Rezept
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {entries.length > 0 && (
        <div className="mt-6">
          <Badge variant="secondary">
            {entries.length} Mahlzeiten geplant
          </Badge>
        </div>
      )}
    </div>
  );
}
