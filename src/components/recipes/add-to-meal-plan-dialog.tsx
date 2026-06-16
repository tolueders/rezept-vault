"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addRecipeToMealPlan } from "@/lib/actions/meal-plan";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
} from "@/lib/constants";
import { formatWeekRange, getWeekStart } from "@/lib/recipe-utils";
import type { MealType } from "@/types/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WEEKDAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

const MEAL_TYPE_STYLES: Record<MealType, string> = {
  fruehstueck: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
  mittagessen: "bg-sky-500/10 text-sky-800 dark:text-sky-200",
  abendessen: "bg-primary/10 text-primary",
  snack: "bg-violet-500/10 text-violet-800 dark:text-violet-200",
};

interface AddToMealPlanDialogProps {
  recipeId: string;
  recipeTitle: string;
  defaultServings: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
}

function getTodayDayIndex() {
  const today = new Date().getDay();
  return today === 0 ? 6 : today - 1;
}

export function AddToMealPlanDialog({
  recipeId,
  recipeTitle,
  defaultServings,
  variant = "outline",
  size = "sm",
  className,
}: AddToMealPlanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(getTodayDayIndex);
  const [mealType, setMealType] = useState<MealType>("abendessen");
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const weekStart = addDays(getWeekStart(), weekOffset * 7);
  const dayDate = addDays(weekStart, dayOfWeek);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDayOfWeek(getTodayDayIndex());
      setMealType("abendessen");
      setWeekOffset(0);
    }
    setOpen(nextOpen);
  }

  async function handleAdd() {
    setLoading(true);
    try {
      await addRecipeToMealPlan({
        recipeId,
        dayOfWeek,
        mealType,
        weekStart: format(weekStart, "yyyy-MM-dd"),
      });
      toast.success(`${recipeTitle} zum Wochenplan hinzugefügt`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Hinzufügen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant={variant} size={size} className={className}>
            <CalendarPlus className="mr-1 h-4 w-4" />
            {size !== "icon" && "Zum Plan"}
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zum Wochenplan hinzufügen</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{recipeTitle}</p>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Woche
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { offset: 0, label: "Diese Woche" },
                { offset: 1, label: "Nächste Woche" },
              ].map(({ offset, label }) => {
                const start = addDays(getWeekStart(), offset * 7);
                return (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => setWeekOffset(offset)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition-colors",
                      weekOffset === offset
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
                    )}
                  >
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatWeekRange(start)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Tag
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_SHORT.map((short, index) => {
                const date = addDays(weekStart, index);
                const isToday = isSameDay(date, today);
                const isSelected = dayOfWeek === index;

                return (
                  <button
                    key={short}
                    type="button"
                    onClick={() => setDayOfWeek(index)}
                    className={cn(
                      "flex flex-col items-center rounded-xl py-2 text-center transition-colors",
                      isSelected &&
                        "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20",
                      !isSelected &&
                        isToday &&
                        "bg-primary/10 ring-1 ring-primary/25",
                      !isSelected &&
                        !isToday &&
                        "bg-secondary/40 hover:bg-secondary/70"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase",
                        isSelected
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {short}
                    </span>
                    <span className="mt-0.5 text-sm font-semibold">
                      {format(date, "d")}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(dayDate, "EEEE, d. MMMM", { locale: de })}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Mahlzeit
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MEAL_TYPE_ORDER.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
                    mealType === type
                      ? cn(MEAL_TYPE_STYLES[type], "ring-2 ring-primary/25 shadow-sm")
                      : "bg-secondary/50 text-foreground hover:bg-secondary"
                  )}
                >
                  {MEAL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Geplant für: </span>
            <span className="font-medium">
              {format(dayDate, "EEE, d. MMM", { locale: de })} ·{" "}
              {MEAL_TYPE_LABELS[mealType]}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {defaultServings} Portionen (Rezept-Standard)
            </span>
          </div>

          <Button className="w-full" onClick={handleAdd} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zum Wochenplan hinzufügen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
