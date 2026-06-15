import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipesHomeView } from "@/components/recipes/recipes-home-view";
import { RecipeSearch } from "@/components/recipes/recipe-search";
import { getUserRecipes, getCategories } from "@/lib/queries/recipes";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { getCustomCategories } from "@/lib/queries/categories";
import { RECIPES_PER_PAGE } from "@/lib/constants";

export const metadata = { title: "Meine Rezepte" };

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const [{ recipes, total }, categories, customCategories, stats] =
    await Promise.all([
      getUserRecipes(page),
      getCategories(),
      getCustomCategories(),
      getDashboardStats(),
    ]);

  const totalPages = Math.ceil(total / RECIPES_PER_PAGE);

  if (page === 1) {
    return (
      <RecipesHomeView
        initialRecipes={recipes}
        categories={categories}
        customCategories={customCategories}
        stats={stats ?? undefined}
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Meine Rezepte</h1>
          <p className="mt-1 text-muted-foreground">
            {total} {total === 1 ? "Rezept" : "Rezepte"} in deiner Sammlung
          </p>
        </div>
        <Button asChild className="hidden md:inline-flex">
          <Link href="/recipes/new">
            <Plus className="mr-1 h-4 w-4" />
            Neues Rezept
          </Link>
        </Button>
      </div>

      <RecipeSearch categories={categories} initialRecipes={recipes} />

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/recipes?page=${p}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
