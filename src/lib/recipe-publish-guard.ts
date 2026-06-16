import { createClient } from "@/lib/supabase/server";
import {
  formValuesToSnapshot,
  recipeWithDetailsToSnapshot,
  snapshotsEqual,
  UNCHANGED_COPY_PUBLISH_MESSAGE,
  type RecipeContentSnapshot,
} from "@/lib/recipe-copy-utils";
import type { RecipeFormValues } from "@/lib/validations/auth";

async function loadRecipeSnapshot(recipeId: string): Promise<RecipeContentSnapshot | null> {
  const { getRecipeById } = await import("@/lib/queries/recipes");
  const recipe = await getRecipeById(recipeId);
  if (!recipe) return null;
  return recipeWithDetailsToSnapshot(recipe);
}

export async function isUnchangedPublicRecipeCopy(recipeId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, parent_recipe_id, user_id")
    .eq("id", recipeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!recipe?.parent_recipe_id) return false;

  const [copySnapshot, parentSnapshot] = await Promise.all([
    loadRecipeSnapshot(recipeId),
    loadRecipeSnapshot(recipe.parent_recipe_id),
  ]);

  if (!copySnapshot || !parentSnapshot) return false;

  return snapshotsEqual(copySnapshot, parentSnapshot);
}

export async function getPublicCopyPublishBlockReason(
  recipeId: string
): Promise<string | null> {
  const unchanged = await isUnchangedPublicRecipeCopy(recipeId);
  return unchanged ? UNCHANGED_COPY_PUBLISH_MESSAGE : null;
}

export async function assertRecipeCanBePublished(
  recipeId: string,
  userId: string,
  pending?: { data: RecipeFormValues; imageUrl?: string | null }
): Promise<void> {
  const supabase = await createClient();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("parent_recipe_id")
    .eq("id", recipeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!recipe?.parent_recipe_id) return;

  const parentSnapshot = await loadRecipeSnapshot(recipe.parent_recipe_id);
  if (!parentSnapshot) return;

  const copySnapshot = pending
    ? formValuesToSnapshot(
        pending.data,
        pending.imageUrl !== undefined
          ? pending.imageUrl
          : ((await loadRecipeSnapshot(recipeId))?.image_url ?? null)
      )
    : await loadRecipeSnapshot(recipeId);

  if (!copySnapshot) return;

  if (snapshotsEqual(copySnapshot, parentSnapshot)) {
    throw new Error(UNCHANGED_COPY_PUBLISH_MESSAGE);
  }
}
