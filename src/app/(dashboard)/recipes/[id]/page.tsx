import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/recipes/recipe-detail";
import {
  getRecipeById,
  getRecipeComments,
  getRecipeVariants,
  getUserRecipeCopyId,
} from "@/lib/queries/recipes";
import { getPublicCopyPublishBlockReason } from "@/lib/recipe-publish-guard";
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

  const [recipe, comments, variants, userCopyId, publicPublishBlockedReason] =
    await Promise.all([
      getRecipeById(id),
      getRecipeComments(id),
      user ? getRecipeVariants(id) : Promise.resolve([]),
      user ? getUserRecipeCopyId(user.id, id) : Promise.resolve(null),
      user ? getPublicCopyPublishBlockReason(id) : Promise.resolve(null),
    ]);

  if (!recipe) notFound();

  return (
    <RecipeDetail
      recipe={recipe}
      comments={comments}
      currentUserId={user?.id}
      isOwner={user?.id === recipe.user_id}
      userCopyId={userCopyId}
      variants={variants}
      publicPublishBlockedReason={publicPublishBlockedReason}
    />
  );
}
