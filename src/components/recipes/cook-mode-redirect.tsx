"use client";

import { CookMode } from "@/components/recipes/cook-mode";
import type { RecipeStep } from "@/types/database";

interface CookModeRedirectProps {
  steps: RecipeStep[];
  title: string;
}

export function CookModeRedirect({ steps, title }: CookModeRedirectProps) {
  return <CookMode steps={steps} title={title} />;
}
