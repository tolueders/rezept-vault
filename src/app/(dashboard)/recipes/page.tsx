import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipesHomeView } from "@/components/recipes/recipes-home-view";
import { RecipeSearch } from "@/components/recipes/recipe-search";
import { getUserRecipes, getCategories } from "@/lib/queries/recipes";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { RECIPES_PER_PAGE } from "@/lib/constants";

export const metadata = { title: "Meine Rezepte" };

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const [{ recipes, total }, categories, stats] = await Promise.all([
    getUserRecipes(page),
    getCategories(),
    getDashboardStats(),
  ]);

  const totalPages = Math.ceil(total / RECIPES_PER_PAGE);

  if (page === 1) {
    return (
      <RecipesHomeView
        initialRecipes={recipes}
        categories={categories}
        stats={stats ?? undefined}
      />
    );
  }

  return (
    <div className="page-content">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Meine Rezepte</h1>
          <p className="page-subtitle">
            {total} {total === 1 ? "Rezept" : "Rezepte"} in deiner Sammlung
          </p>
        </div>
        <Button asChild className="hidden md:inline-flex">
          <Link href="/recipes/new">
            <Plus className="mr-1 h-4 w-4" />
            Neues Rezept
          </Link>
        </Button>
      </header>

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
