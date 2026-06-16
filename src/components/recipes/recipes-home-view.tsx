"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Compass,
  Heart,
} from "lucide-react";
import { RecipeSearchFilters } from "@/components/recipes/recipe-search-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { searchRecipesAction } from "@/lib/actions/recipes";
import type { CustomCategory, RecipeCategory } from "@/types/database";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";

type RecipeItem = Parameters<typeof RecipeCard>[0]["recipe"];

interface RecipesHomeViewProps {
  initialRecipes: RecipeItem[];
  categories: RecipeCategory[];
  customCategories?: CustomCategory[];
  stats?: {
    displayName: string;
    recipeCount: number;
    favoriteCount: number;
    publicCount: number;
    plannedMeals: number;
  };
}

export function RecipesHomeView({
  initialRecipes,
  categories,
  customCategories = [],
  stats,
}: RecipesHomeViewProps) {
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

  const quickLinks = stats
    ? [
        { label: "Rezepte", value: stats.recipeCount, href: "/recipes", icon: BookOpen },
        { label: "Favoriten", value: stats.favoriteCount, href: "/favorites", icon: Heart },
        { label: "Öffentlich", value: stats.publicCount, href: "/discover", icon: Compass },
        { label: "Geplant", value: stats.plannedMeals, href: "/meal-plan", icon: Calendar },
      ]
    : [];

  const quickLinksGrid =
    quickLinks.length > 0 ? (
      <div className="mt-3 grid grid-cols-4 gap-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center transition-colors hover:bg-secondary/60 active:bg-secondary"
          >
            <link.icon className="h-4 w-4 text-primary/80" />
            <span className="text-base font-bold leading-none">{link.value}</span>
            <span className="text-[10px] leading-tight text-muted-foreground">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    ) : null;

  return (
    <div className="page-content">
      <header className="page-header !mb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="page-title">Meine Rezepte</h1>
            {stats && (
              <>
                <p className="page-eyebrow mt-4">Willkommen zurück</p>
                <p className="page-greeting truncate">Hallo, {stats.displayName}!</p>
              </>
            )}
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
        {quickLinksGrid}
      </header>

      <RecipeSearchFilters
        query={query}
        onQueryChange={setQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories}
        customCategories={customCategories}
        hasActiveFilter={hasActiveFilter}
        onClearFilters={clearFilters}
      />

      {/* Rezept-Grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl sm:h-28" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/15 px-6 py-14 text-center sm:py-16">
          <p className="text-lg font-semibold">
            {hasActiveFilter ? "Keine Rezepte gefunden" : "Noch keine Rezepte"}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {hasActiveFilter
              ? "Probiere andere Suchbegriffe oder wähle 'Alle' in den Kategorien."
              : "Tippe unten rechts auf + und lege dein erstes Rezept an."}
          </p>
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
