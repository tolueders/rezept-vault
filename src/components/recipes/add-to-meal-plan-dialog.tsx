"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { addRecipeToMealPlan } from "@/lib/actions/meal-plan";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_ORDER,
  WEEKDAYS,
} from "@/lib/constants";
import { getWeekStart } from "@/lib/recipe-utils";
import type { MealType } from "@/types/database";
import { toast } from "sonner";

interface AddToMealPlanDialogProps {
  recipeId: string;
  recipeTitle: string;
  defaultServings: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
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
  const [dayOfWeek, setDayOfWeek] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [mealType, setMealType] = useState<MealType>("abendessen");
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = addDays(getWeekStart(), weekOffset * 7);
  const dayDate = addDays(weekStart, dayOfWeek);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={variant} size={size} className={className}>
            <CalendarPlus className="mr-1 h-4 w-4" />
            {size !== "icon" && "Zum Plan"}
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Zum Wochenplan hinzufügen</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{recipeTitle}</p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Woche</Label>
            <Select
              value={String(weekOffset)}
              onValueChange={(v) => setWeekOffset(Number(v ?? 0))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Diese Woche</SelectItem>
                <SelectItem value="1">Nächste Woche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tag</Label>
            <Select
              value={String(dayOfWeek)}
              onValueChange={(v) => setDayOfWeek(Number(v ?? 0))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((day, i) => (
                  <SelectItem key={day} value={String(i)}>
                    {day} ({format(addDays(weekStart, i), "d. MMM")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mahlzeit</Label>
            <Select
              value={mealType}
              onValueChange={(v) =>
                setMealType((v as MealType) ?? "abendessen")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPE_ORDER.map((type) => (
                  <SelectItem key={type} value={type}>
                    {MEAL_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {defaultServings} Portionen (Rezept-Standard)
          </p>

          <Button className="w-full" onClick={handleAdd} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hinzufügen – {WEEKDAYS[dayOfWeek]}, {format(dayDate, "d. MMM")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
