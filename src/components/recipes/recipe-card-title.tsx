"use client";

import { cn } from "@/lib/utils";

interface RecipeCardTitleProps {
  title: string;
  compact?: boolean;
}

function getTitleSizeClass(title: string, compact: boolean) {
  const length = title.length;

  if (compact) {
    if (length <= 18) {
      return "text-[clamp(1.0625rem,0.95rem+0.75cqw,1.3125rem)] leading-[1.2] sm:leading-[1.15]";
    }
    if (length <= 36) {
      return "text-[clamp(0.9375rem,0.85rem+0.6cqw,1.125rem)] leading-[1.2]";
    }
    return "text-[clamp(0.875rem,0.8rem+0.45cqw,1.0625rem)] leading-[1.2] sm:leading-snug";
  }

  if (length <= 22) {
    return "text-[clamp(1.125rem,1rem+0.55cqw,1.4375rem)] leading-6 sm:leading-7";
  }
  if (length <= 44) {
    return "text-[clamp(1rem,0.925rem+0.45cqw,1.1875rem)] leading-6";
  }
  return "text-[clamp(0.875rem,0.8rem+0.35cqw,1.0625rem)] leading-5 sm:leading-6";
}

export function RecipeCardTitle({ title, compact = false }: RecipeCardTitleProps) {
  return (
    <h3
      className={cn(
        "line-clamp-2 w-full font-semibold tracking-tight",
        compact && "min-h-[2.5rem] sm:min-h-[2.875rem]",
        !compact && "min-h-12 sm:min-h-[3.25rem]",
        getTitleSizeClass(title, compact)
      )}
    >
      {title}
    </h3>
  );
}
