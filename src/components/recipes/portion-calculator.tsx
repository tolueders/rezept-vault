"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scaleIngredients, formatAmount } from "@/lib/recipe-utils";
import type { RecipeIngredient } from "@/types/database";

interface PortionCalculatorProps {
  ingredients: RecipeIngredient[];
  originalServings: number;
}

export function PortionCalculator({
  ingredients,
  originalServings,
}: PortionCalculatorProps) {
  const [servings, setServings] = useState(originalServings);
  const scaled = scaleIngredients(ingredients, originalServings, servings);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium">Portionen:</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setServings(Math.max(1, servings - 1))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-semibold">{servings}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => setServings(servings + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ul className="space-y-2">
        {scaled.map((ing) => (
          <li
            key={ing.id}
            className="flex justify-between border-b border-border/40 py-2 text-sm"
          >
            <span>{ing.name}</span>
            <span className="font-medium text-muted-foreground">
              {formatAmount(ing.amount, ing.unit)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
