import { FavoritesView } from "@/components/recipes/favorites-view";
import { getFavoriteRecipes, getCategories } from "@/lib/queries/recipes";

export const metadata = { title: "Favoriten" };

export default async function FavoritesPage() {
  const [recipes, categories] = await Promise.all([
    getFavoriteRecipes(),
    getCategories(),
  ]);

  return (
    <FavoritesView initialRecipes={recipes} categories={categories} />
  );
}
