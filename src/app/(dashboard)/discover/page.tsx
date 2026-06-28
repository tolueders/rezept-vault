import { DiscoverHomeView } from "@/components/recipes/discover-home-view";
import { getPublicRecipes, getCategories } from "@/lib/queries/recipes";
import { standardCategoriesToUserViews } from "@/lib/category-utils";

export const metadata = { title: "Entdecken" };

export default async function DiscoverPage() {
  const [{ recipes, total }, categories] = await Promise.all([
    getPublicRecipes(1),
    getCategories(),
  ]);

  return (
    <DiscoverHomeView
      initialRecipes={recipes}
      categories={standardCategoriesToUserViews(categories)}
      totalCount={total}
    />
  );
}
