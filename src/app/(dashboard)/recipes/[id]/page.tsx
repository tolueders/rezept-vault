import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/recipes/recipe-detail";
import {
  getRecipeById,
  getRecipeComments,
} from "@/lib/queries/recipes";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  return { title: recipe?.title || "Rezept" };
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [recipe, comments] = await Promise.all([
    getRecipeById(id),
    getRecipeComments(id),
  ]);

  if (!recipe) notFound();

  return (
    <RecipeDetail
      recipe={recipe}
      comments={comments}
      currentUserId={user?.id}
      isOwner={user?.id === recipe.user_id}
    />
  );
}
