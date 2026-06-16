import { notFound, redirect } from "next/navigation";
import { getRecipeById } from "@/lib/queries/recipes";
import { createClient } from "@/lib/supabase/server";
import { CookModeRedirect } from "@/components/recipes/cook-mode-redirect";

export const metadata = { title: "Kochmodus" };

export default async function CookModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const recipe = await getRecipeById(id);
  if (!recipe || recipe.user_id !== user.id) notFound();

  return (
    <CookModeRedirect
      steps={recipe.steps}
      ingredients={recipe.ingredients}
      servings={recipe.servings}
      title={recipe.title}
    />
  );
}
