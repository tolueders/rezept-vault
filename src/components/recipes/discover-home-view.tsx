"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicRecipeCard } from "@/components/recipes/public-recipe-card";
import { RecipeSearchFilters } from "@/components/recipes/recipe-search-filters";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";
import { searchPublicRecipesAction } from "@/lib/actions/recipes";
import type { RecipeCategory } from "@/types/database";

type PublicRecipeItem = Parameters<typeof PublicRecipeCard>[0]["recipe"];

interface DiscoverHomeViewProps {
  initialRecipes: PublicRecipeItem[];
  categories: RecipeCategory[];
  totalCount: number;
}

export function DiscoverHomeView({
  initialRecipes,
  categories,
  totalCount,
}: DiscoverHomeViewProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [results, setResults] = useState(initialRecipes);
  const [loading, setLoading] = useState(false);

  const hasActiveFilter = query.length > 0 || categoryFilter !== "all";

  const doSearch = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const data = await searchPublicRecipesAction(
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
      <header className="page-header !mb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="page-title">Entdecken</h1>
            <p className="page-subtitle">
              Öffentliche Rezepte von anderen Nutzern
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            {loading ? "…" : results.length}
            {!loading && (
              <span className="ml-0.5 font-normal text-primary/70">
                {results.length === 1 ? "Treffer" : "Treffer"}
              </span>
            )}
          </span>
        </div>
      </header>

      <RecipeSearchFilters
        query={query}
        onQueryChange={setQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories}
        hasActiveFilter={hasActiveFilter}
        onClearFilters={clearFilters}
        searchPlaceholder="Rezepte, Zutaten oder Tags suchen…"
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl sm:h-28" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/15 px-6 py-14 text-center sm:py-16">
          <p className="text-lg font-semibold">
            {hasActiveFilter
              ? "Keine öffentlichen Rezepte gefunden"
              : "Noch keine öffentlichen Rezepte"}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {hasActiveFilter
              ? "Probiere andere Suchbegriffe oder wähle „Alle“ in den Kategorien."
              : totalCount === 0
                ? "Markiere ein Rezept als „Öffentlich“, damit es hier erscheint."
                : "Es wurden keine passenden Rezepte gefunden."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {results.map((recipe) => (
            <PublicRecipeCard key={recipe.id} recipe={recipe} variant="compact" />
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
}
