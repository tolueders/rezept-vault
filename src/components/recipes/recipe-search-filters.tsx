"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  RecipeFilterChip,
  buildCategoryFilters,
} from "@/components/recipes/recipe-filter-chips";
import type { RecipeCategory } from "@/types/database";
import { cn } from "@/lib/utils";

interface RecipeSearchFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (filter: string) => void;
  categories: RecipeCategory[];
  hasActiveFilter: boolean;
  onClearFilters: () => void;
  searchPlaceholder?: string;
  className?: string;
  sticky?: boolean;
  topSlot?: React.ReactNode;
}

export function RecipeSearchFilters({
  query,
  onQueryChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  hasActiveFilter,
  onClearFilters,
  searchPlaceholder = "Rezepte, Zutaten oder Tags suchen…",
  className,
  sticky = true,
  topSlot,
}: RecipeSearchFiltersProps) {
  const allCategories = buildCategoryFilters(categories);

  return (
    <section
      className={cn(
        sticky &&
          "home-sticky-bar sticky z-30 -mx-4 border-b border-border/40 bg-background/95 backdrop-blur-lg md:surface-card md:static md:mx-0 md:top-auto md:overflow-hidden md:rounded-2xl md:border md:border-border/50 md:bg-card/95",
        className
      )}
    >
      {topSlot}

      <div
        className={cn(
          "px-4 py-4 md:px-6",
          topSlot && "border-t border-border/40"
        )}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="h-11 rounded-xl border-border/50 bg-secondary/30 pl-11 pr-11 shadow-none focus-visible:border-primary/30 focus-visible:bg-background md:h-12"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Suche löschen"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 px-4 pb-4 pt-3 md:px-6 md:pb-5">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Kategorie filtern
        </p>
        <div className="filter-scroll-wrap -mx-1">
          <div className="filter-scroll">
            {allCategories.map((cat) => (
              <RecipeFilterChip
                key={cat.id}
                active={categoryFilter === cat.filter}
                onClick={() => onCategoryFilterChange(cat.filter)}
                variant={cat.custom ? "custom" : "default"}
              >
                {cat.label}
              </RecipeFilterChip>
            ))}
          </div>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>
    </section>
  );
}
