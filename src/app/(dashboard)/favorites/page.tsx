import { Heart } from "lucide-react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { getFavoriteRecipes } from "@/lib/queries/recipes";

export const metadata = { title: "Favoriten" };

export default async function FavoritesPage() {
  const recipes = await getFavoriteRecipes();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Favoriten</h1>
      <p className="mb-8 text-muted-foreground">
        Deine Lieblingsrezepte auf einen Blick
      </p>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Noch keine Favoriten</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
