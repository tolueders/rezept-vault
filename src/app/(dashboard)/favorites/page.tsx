import { Heart } from "lucide-react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { getFavoriteRecipes } from "@/lib/queries/recipes";

export const metadata = { title: "Favoriten" };

export default async function FavoritesPage() {
  const recipes = await getFavoriteRecipes();

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Favoriten</h1>
        <p className="page-subtitle">Deine Lieblingsrezepte auf einen Blick</p>
      </header>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Noch keine Favoriten</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
