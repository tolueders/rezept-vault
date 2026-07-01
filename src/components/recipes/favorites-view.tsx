"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { RecipeSearchFilters } from "@/components/recipes/recipe-search-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { searchFavoriteRecipesAction } from "@/lib/actions/recipes";
import type { UserCategoryView } from "@/types/database";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";

type RecipeItem = Parameters<typeof RecipeCard>[0]["recipe"];

interface FavoritesViewProps {
  initialRecipes: RecipeItem[];
  categories: UserCategoryView[];
}

export function FavoritesView({
  initialRecipes,
  categories,
}: FavoritesViewProps) {
  const [query, setQuery] = useState("");
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [results, setResults] = useState(initialRecipes);
  const [loading, setLoading] = useState(false);

  const hasActiveFilter = query.length > 0 || categoryFilters.length > 0;

  const doSearch = useCallback(async (q: string, filters: string[]) => {
    setLoading(true);
    try {
      const data = await searchFavoriteRecipesAction(
        q,
        filters.length > 0 ? filters : undefined
      );
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query, categoryFilters);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, categoryFilters, doSearch]);

  function clearFilters() {
    setQuery("");
    setCategoryFilters([]);
  }

  return (
    <div className="page-content">
      <header className="page-header !mb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="page-title">Favoriten</h1>
            <p className="page-subtitle">Deine Lieblingsrezepte auf einen Blick</p>
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
        categoryFilters={categoryFilters}
        onCategoryFiltersChange={setCategoryFilters}
        categories={categories}
        hasActiveFilter={hasActiveFilter}
        onClearFilters={clearFilters}
        searchPlaceholder="Favoriten, Zutaten oder Tags suchen…"
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl sm:h-28" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/15 px-6 py-14 text-center sm:py-16">
          {hasActiveFilter ? (
            <>
              <p className="text-lg font-semibold">Keine Favoriten gefunden</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Probiere andere Suchbegriffe oder passe die Kategorien an.
              </p>
            </>
          ) : (
            <>
              <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-semibold">Noch keine Favoriten</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Markiere Rezepte mit dem Herz-Symbol, dann erscheinen sie hier.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {results.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} variant="compact" />
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
}
