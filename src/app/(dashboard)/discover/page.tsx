import { DiscoverHomeView } from "@/components/recipes/discover-home-view";
import { getPublicRecipes } from "@/lib/queries/recipes";
import { getDiscoverCategories } from "@/lib/queries/categories";

export const metadata = { title: "Entdecken" };

export default async function DiscoverPage() {
  const [{ recipes, total }, categories] = await Promise.all([
    getPublicRecipes(1),
    getDiscoverCategories(),
  ]);

  return (
    <DiscoverHomeView
      initialRecipes={recipes}
      categories={categories}
      totalCount={total}
    />
  );
}
