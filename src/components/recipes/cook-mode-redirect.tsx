"use client";

import { CookMode } from "@/components/recipes/cook-mode";
import type { RecipeIngredient, RecipeStep } from "@/types/database";

interface CookModeRedirectProps {
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  servings: number;
  title: string;
}

export function CookModeRedirect({
  steps,
  ingredients,
  servings,
  title,
}: CookModeRedirectProps) {
  return (
    <CookMode
      steps={steps}
      ingredients={ingredients}
      servings={servings}
      title={title}
    />
  );
}
