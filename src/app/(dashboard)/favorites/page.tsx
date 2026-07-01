import { FavoritesView } from "@/components/recipes/favorites-view";
import { getFavoriteRecipes } from "@/lib/queries/recipes";
import { getUserCategories } from "@/lib/queries/categories";

export const metadata = { title: "Favoriten" };

export default async function FavoritesPage() {
  const [recipes, categories] = await Promise.all([
    getFavoriteRecipes(),
    getUserCategories(),
  ]);

  return (
    <FavoritesView initialRecipes={recipes} categories={categories} />
  );
}
