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
import { WEEKDAYS } from "@/lib/constants";
import { formatWeekRange } from "@/lib/recipe-utils";
import type { MealPlanEntry, Recipe } from "@/types/database";
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
  const [loading, setLoading] = useState(false);

  const startDate = parseISO(weekStart);

  function navigateWeek(offset: number) {
    const newStart = addDays(startDate, offset * 7);
    router.push(`/meal-plan?week=${format(newStart, "yyyy-MM-dd")}`);
  }

  async function handleAddEntry(dayOfWeek: number) {
    if (!selectedRecipe) return;
    setLoading(true);
    try {
      await addMealPlanEntry(mealPlanId, dayOfWeek, selectedRecipe);
      setAddingDay(null);
      setSelectedRecipe("");
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
      toast.success("Einkaufsliste erstellt");
      router.push(`/shopping-list?id=${list.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Wochenplanung</h1>
          <p className="mt-1 text-muted-foreground">
            {formatWeekRange(startDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={handleGenerateList} disabled={loading || entries.length === 0}>
            <ShoppingCart className="mr-1 h-4 w-4" />
            Einkaufsliste
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {WEEKDAYS.map((day, index) => {
          const dayEntries = entries.filter((e) => e.day_of_week === index);
          const dayDate = addDays(startDate, index);

          return (
            <Card key={day} className="border-border/60">
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
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                  >
                    <Link
                      href={`/recipes/${entry.recipe_id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {entry.recipe?.title || "Rezept"}
                    </Link>
                    <button onClick={() => handleRemove(entry.id)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}

                {addingDay === index ? (
                  <div className="space-y-2">
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
