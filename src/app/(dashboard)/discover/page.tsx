import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DiscoverSearch } from "@/components/recipes/discover-search";
import { getPublicRecipes, getCategories } from "@/lib/queries/recipes";
import { RECIPES_PER_PAGE } from "@/lib/constants";

export const metadata = { title: "Entdecken" };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const [{ recipes, total }, categories] = await Promise.all([
    getPublicRecipes(page),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / RECIPES_PER_PAGE);

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Entdecken</h1>
        <p className="page-subtitle">
          Öffentliche Rezepte von anderen Nutzern – {total}{" "}
          {total === 1 ? "Rezept" : "Rezepte"} verfügbar
        </p>
      </header>

      <DiscoverSearch categories={categories} initialRecipes={recipes} />

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/discover?page=${p}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
