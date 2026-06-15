"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { scaleIngredients, formatAmount } from "@/lib/recipe-utils";
import type { RecipeIngredient, RecipeStep } from "@/types/database";

interface CookModeProps {
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  servings: number;
  title: string;
  onClose?: () => void;
}

export function CookMode({
  steps,
  ingredients,
  servings,
  title,
  onClose,
}: CookModeProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const sortedSteps = [...steps].sort((a, b) => a.sort_order - b.sort_order);
  const scaled = scaleIngredients(ingredients, servings, servings);

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock not supported
      }
    }

    requestWakeLock();
    return () => {
      wakeLock?.release();
    };
  }, []);

  function handleClose() {
    if (onClose) onClose();
    else router.back();
  }

  function toggleIngredient(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const step = sortedSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex-1 text-center">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-sm font-medium">
            Schritt {currentStep + 1} von {sortedSteps.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIngredients((s) => !s)}
          >
            Zutaten
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {showIngredients && (
        <div className="max-h-48 overflow-y-auto border-b border-border px-4 py-3">
          <ul className="space-y-2">
            {scaled.map((ing) => (
              <li key={ing.id} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={checked.has(ing.id)}
                  onCheckedChange={() => toggleIngredient(ing.id)}
                />
                <span className={checked.has(ing.id) ? "line-through opacity-50" : ""}>
                  {ing.name}
                </span>
                <span className="ml-auto text-muted-foreground">
                  {formatAmount(ing.amount, ing.unit)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {currentStep + 1}
        </div>
        <p className="cook-mode-text max-w-2xl text-center">{step?.instruction}</p>
      </div>

      <div className="flex gap-4 border-t border-border p-4">
        <Button
          variant="outline"
          className="h-14 flex-1 text-lg"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => s - 1)}
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Zurück
        </Button>
        {currentStep >= sortedSteps.length - 1 ? (
          <Button className="h-14 flex-1 text-lg" onClick={handleClose}>
            Fertig!
          </Button>
        ) : (
          <Button
            className="h-14 flex-1 text-lg"
            onClick={() => setCurrentStep((s) => s + 1)}
          >
            Weiter
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
