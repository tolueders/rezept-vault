import { FavoritesView } from "@/components/recipes/favorites-view";
import { getFavoriteRecipes, getCategories } from "@/lib/queries/recipes";
import { getCustomCategories } from "@/lib/queries/categories";

export const metadata = { title: "Favoriten" };

export default async function FavoritesPage() {
  const [recipes, categories, customCategories] = await Promise.all([
    getFavoriteRecipes(),
    getCategories(),
    getCustomCategories(),
  ]);

  return (
    <FavoritesView
      initialRecipes={recipes}
      categories={categories}
      customCategories={customCategories}
    />
  );
}
