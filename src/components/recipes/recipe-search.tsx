"use client";

import { useCallback, useEffect, useState } from "react";
import { RecipeSearchFilters } from "@/components/recipes/recipe-search-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { searchRecipesAction } from "@/lib/actions/recipes";
import type { RecipeCategory } from "@/types/database";

interface RecipeSearchProps {
  categories: RecipeCategory[];
  initialRecipes?: Parameters<typeof RecipeCard>[0]["recipe"][];
}

export function RecipeSearch({
  categories,
  initialRecipes = [],
}: RecipeSearchProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [results, setResults] = useState(initialRecipes);
  const [loading, setLoading] = useState(false);

  const hasActiveFilter = query.length > 0 || categoryFilter !== "all";

  const doSearch = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const data = await searchRecipesAction(
        q,
        cat === "all" ? undefined : cat
      );
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query, categoryFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, categoryFilter, doSearch]);

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
  }

  return (
    <div className="page-content">
      <RecipeSearchFilters
        query={query}
        onQueryChange={setQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories}
        hasActiveFilter={hasActiveFilter}
        onClearFilters={clearFilters}
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl sm:h-28" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {hasActiveFilter
            ? "Keine Rezepte gefunden"
            : "Noch keine Rezepte vorhanden"}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {results.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
