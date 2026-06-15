import { notFound } from "next/navigation";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { getRecipeById, getCategories } from "@/lib/queries/recipes";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Variante erstellen" };

export default async function VariantRecipePage({
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

  const variantRecipe = {
    ...recipe,
    title: `${recipe.title} – Variante`,
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Variante erstellen</h1>
      <p className="mb-8 text-muted-foreground">
        Basierend auf: {recipe.title}
      </p>
      <RecipeForm
        categories={categories}
        recipe={variantRecipe}
        mode="variant"
        originalRecipeId={id}
      />
    </div>
  );
}
