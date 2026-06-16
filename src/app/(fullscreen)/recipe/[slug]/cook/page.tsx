import { notFound } from "next/navigation";
import { getRecipeBySlug } from "@/lib/queries/recipes";
import { CookModeRedirect } from "@/components/recipes/cook-mode-redirect";

export const metadata = { title: "Kochmodus" };

export default async function PublicCookModePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe || !recipe.is_public) notFound();

  return (
    <CookModeRedirect
      steps={recipe.steps}
      ingredients={recipe.ingredients}
      servings={recipe.servings}
      title={recipe.title}
    />
  );
}
