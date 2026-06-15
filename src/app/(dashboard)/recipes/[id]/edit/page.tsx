import { notFound } from "next/navigation";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { getRecipeById, getCategories } from "@/lib/queries/recipes";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Rezept bearbeiten" };

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [recipe, categories] = await Promise.all([
    getRecipeById(id),
    getCategories(),
  ]);

  if (!recipe || recipe.user_id !== user?.id) notFound();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Rezept bearbeiten</h1>
      <RecipeForm categories={categories} recipe={recipe} mode="edit" />
    </div>
  );
}
