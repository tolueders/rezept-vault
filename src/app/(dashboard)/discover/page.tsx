import { DiscoverHomeView } from "@/components/recipes/discover-home-view";
import { getPublicRecipes, getCategories } from "@/lib/queries/recipes";
import { getCustomCategories } from "@/lib/queries/categories";

export const metadata = { title: "Entdecken" };

export default async function DiscoverPage() {
  const [{ recipes, total }, categories, customCategories] = await Promise.all([
    getPublicRecipes(1),
    getCategories(),
    getCustomCategories(),
  ]);

  return (
    <DiscoverHomeView
      initialRecipes={recipes}
      categories={categories}
      customCategories={customCategories}
      totalCount={total}
    />
  );
}
