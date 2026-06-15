"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicRecipeCard } from "@/components/recipes/public-recipe-card";
import { searchPublicRecipesAction } from "@/lib/actions/recipes";
import type { RecipeCategory } from "@/types/database";

interface DiscoverSearchProps {
  categories: RecipeCategory[];
  initialRecipes: Parameters<typeof PublicRecipeCard>[0]["recipe"][];
}

export function DiscoverSearch({
  categories,
  initialRecipes,
}: DiscoverSearchProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [results, setResults] = useState(initialRecipes);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(
    async (q: string, cat: string) => {
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
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query, categoryId);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, categoryId, doSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rezepte oder Tags suchen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {query || categoryId !== "all"
            ? "Keine öffentlichen Rezepte gefunden"
            : "Noch keine öffentlichen Rezepte vorhanden"}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((recipe) => (
            <PublicRecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
