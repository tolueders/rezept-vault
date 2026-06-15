"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Compass,
  Heart,
  Search,
  X,
} from "lucide-react";
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

  const quickLinks = stats
    ? [
        { label: "Rezepte", value: stats.recipeCount, href: "/recipes", icon: BookOpen },
        { label: "Favoriten", value: stats.favoriteCount, href: "/favorites", icon: Heart },
        { label: "Öffentlich", value: stats.publicCount, href: "/discover", icon: Compass },
        { label: "Geplant", value: stats.plannedMeals, href: "/meal-plan", icon: Calendar },
      ]
    : [];

  const allCategories = [
    { id: "all", label: "Alle", filter: "all", custom: false },
    ...categories.map((c) => ({
      id: c.id,
      label: c.name,
      filter: `std:${c.id}`,
      custom: false,
    })),
    ...customCategories.map((c) => ({
      id: c.id,
      label: c.name,
      filter: `custom:${c.id}`,
      custom: true,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Sticky Filter-Block */}
      <section
        className={cn(
          "surface-card sticky top-14 z-30 -mx-4 border-b border-border/40 bg-card/95 backdrop-blur-md",
          "md:static md:mx-0 md:overflow-hidden md:rounded-2xl md:border md:border-border/50"
        )}
      >
        {/* Begrüßung */}
        {stats && (
          <div className="flex items-start justify-between gap-4 px-4 pb-4 pt-5 md:px-6 md:pt-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70">
                Willkommen zurück
              </p>
              <h1 className="page-title mt-1 truncate">
                Hallo, {stats.displayName}!
              </h1>
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
        )}

        {/* Schnellzugriff – kompaktes Grid, kein zweites Filterband */}
        {quickLinks.length > 0 && (
          <div className="grid grid-cols-4 gap-2 border-t border-border/40 px-4 py-4 md:px-6">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center transition-colors hover:bg-secondary/60 active:bg-secondary"
              >
                <link.icon className="h-4 w-4 text-primary/80" />
                <span className="text-base font-bold leading-none">{link.value}</span>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Suche */}
        <div className="border-t border-border/40 px-4 py-4 md:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rezepte, Zutaten oder Tags suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-xl border-border/50 bg-secondary/30 pl-11 pr-11 shadow-none focus-visible:border-primary/30 focus-visible:bg-background md:h-12"
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
        </div>

        {/* Kategorie-Filter – horizontal scrollbar mit Fade */}
        <div className="border-t border-border/40 px-4 pb-4 pt-3 md:px-6 md:pb-5">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Kategorie filtern
          </p>
          <div className="filter-scroll-wrap -mx-1">
            <div className="filter-scroll">
              {allCategories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  active={categoryFilter === cat.filter}
                  onClick={() => setCategoryFilter(cat.filter)}
                  variant={cat.custom ? "custom" : "default"}
                >
                  {cat.label}
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
        </div>
      </section>

      {/* Rezept-Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
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
