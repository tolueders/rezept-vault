import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/recipes/recipe-detail";
import { getRecipeBySlug, getRecipeComments } from "@/lib/queries/recipes";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  return {
    title: recipe ? `${recipe.title} | ${APP_NAME}` : "Rezept",
    description: recipe?.description,
  };
}

export default async function PublicRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();

  const comments = await getRecipeComments(recipe.id);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <RecipeDetail
          recipe={recipe}
          comments={comments}
          currentUserId={user?.id}
          isOwner={user?.id === recipe.user_id}
          isPublicView
        />
      </main>
    </div>
  );
}
