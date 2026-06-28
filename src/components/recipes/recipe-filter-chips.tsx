"use client";

import { cn } from "@/lib/utils";
import type { UserCategoryView } from "@/types/database";

export function buildCategoryFilters(categories: UserCategoryView[]) {
  return [
    { id: "all", label: "Alle", filter: "all", custom: false },
    ...categories.map((c) => ({
      id: c.filterKey,
      label: c.name,
      filter: c.filterKey,
      custom: c.isCustom,
    })),
  ];
}

export function toggleCategoryFilterSelection(
  selected: string[],
  filterKey: string
): string[] {
  if (filterKey === "all") return [];
  return selected.includes(filterKey)
    ? selected.filter((filter) => filter !== filterKey)
    : [...selected, filterKey];
}

export function RecipeFilterChip({
  children,
  active,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "custom";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.97]",
        active
          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
          : variant === "custom"
            ? "border border-dashed border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/5"
            : "bg-secondary/80 text-foreground hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}
