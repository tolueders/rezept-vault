"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { searchRecipesAction } from "@/lib/actions/recipes";
import type { CustomCategory, RecipeCategory } from "@/types/database";
import { cn } from "@/lib/utils";

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

  const statPills = stats
    ? [
        { label: "Rezepte", value: stats.recipeCount, href: "/recipes" },
        { label: "Favoriten", value: stats.favoriteCount, href: "/favorites" },
        { label: "Öffentlich", value: stats.publicCount, href: "/discover" },
        { label: "Geplant", value: stats.plannedMeals, href: "/meal-plan" },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Filter oben – sticky unter dem Header */}
      <section
        className={cn(
          "sticky top-14 z-30 -mx-4 border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur-lg",
          "md:static md:mx-0 md:rounded-2xl md:border md:bg-card md:px-5 md:py-5 md:shadow-sm"
        )}
      >
        {stats && (
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">
                Willkommen zurück
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Hallo, {stats.displayName}!
              </h1>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              {loading ? "…" : `${results.length} ${results.length === 1 ? "Treffer" : "Treffer"}`}
            </span>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rezepte, Zutaten oder Tags suchen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-xl border-border/60 bg-secondary/40 pl-11 pr-11 text-base shadow-none focus-visible:bg-background md:h-12"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Suche löschen"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Kategorie
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip
              active={categoryFilter === "all"}
              onClick={() => setCategoryFilter("all")}
            >
              Alle
            </FilterChip>
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                active={categoryFilter === `std:${cat.id}`}
                onClick={() => setCategoryFilter(`std:${cat.id}`)}
              >
                {cat.name}
              </FilterChip>
            ))}
            {customCategories.map((cat) => (
              <FilterChip
                key={cat.id}
                active={categoryFilter === `custom:${cat.id}`}
                onClick={() => setCategoryFilter(`custom:${cat.id}`)}
                variant="custom"
              >
                {cat.name}
              </FilterChip>
            ))}
          </div>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </section>

      {/* Kompakte Statistik */}
      {stats && statPills.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statPills.map((pill) => (
            <Link
              key={pill.href}
              href={pill.href}
              className="flex min-w-[5.5rem] shrink-0 flex-col items-center rounded-xl border border-border/60 bg-card px-4 py-3 text-center shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <span className="text-lg font-bold leading-none">{pill.value}</span>
              <span className="mt-1 text-xs text-muted-foreground">{pill.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Rezept-Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-6 py-16 text-center">
          <p className="text-lg font-medium">
            {hasActiveFilter ? "Keine Rezepte gefunden" : "Noch keine Rezepte"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasActiveFilter
              ? "Probiere andere Suchbegriffe oder Kategorien."
              : "Tippe auf + und lege dein erstes Rezept an."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {results.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
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
        "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : variant === "custom"
            ? "border border-dashed border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
    >
      {children}
    </button>
  );
}
