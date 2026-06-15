import { RecipeForm } from "@/components/recipes/recipe-form";
import { getCategories } from "@/lib/queries/recipes";

export const metadata = { title: "Neues Rezept" };

export default async function NewRecipePage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold sm:text-3xl">Neues Rezept</h1>
      <RecipeForm categories={categories} />
    </div>
  );
}
