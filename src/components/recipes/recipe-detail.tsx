"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Heart,
  Share2,
  Trash2,
  Users,
  ChefHat,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StarRating } from "@/components/recipes/star-rating";
import { PortionCalculator } from "@/components/recipes/portion-calculator";
import { CommentsSection } from "@/components/recipes/comments-section";
import { CookMode } from "@/components/recipes/cook-mode";
import { AddToMealPlanDialog } from "@/components/recipes/add-to-meal-plan-dialog";
import { RecipeVariants } from "@/components/recipes/recipe-variants";
import {
  toggleFavorite,
  rateRecipe,
  deleteRecipe,
  copyRecipeToCollection,
} from "@/lib/actions/recipes";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import { shareOrCopy } from "@/lib/share-utils";
import type { RecipeWithDetails } from "@/types/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecipeDetailProps {
  recipe: RecipeWithDetails;
  comments: Parameters<typeof CommentsSection>[0]["comments"];
  currentUserId?: string;
  isOwner: boolean;
  isPublicView?: boolean;
  userCopyId?: string | null;
  variants?: Parameters<typeof RecipeVariants>[0]["variants"];
}

export function RecipeDetail({
  recipe,
  comments,
  currentUserId,
  isOwner,
  isPublicView = false,
  userCopyId = null,
  variants = [],
}: RecipeDetailProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(recipe.is_favorited || false);
  const [userRating, setUserRating] = useState(recipe.user_rating || 0);
  const [cookMode, setCookMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copying, setCopying] = useState(false);

  const canCopyToCollection =
    recipe.is_public && !!currentUserId && !isOwner && !userCopyId;

  async function handleFavorite() {
    if (!currentUserId) {
      toast.error("Bitte melde dich an");
      return;
    }
    const result = await toggleFavorite(recipe.id);
    setFavorited(result.favorited);
    toast.success(result.favorited ? "Zu Favoriten hinzugefügt" : "Aus Favoriten entfernt");
  }

  async function handleRate(rating: number) {
    if (!currentUserId) {
      toast.error("Bitte melde dich an");
      return;
    }
    await rateRecipe(recipe.id, rating);
    setUserRating(rating);
    toast.success("Bewertung gespeichert");
    router.refresh();
  }

  async function confirmDelete() {
    try {
      await deleteRecipe(recipe.id);
      toast.success("Rezept gelöscht");
      router.push("/recipes");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Löschen");
    }
  }

  async function handleCopy() {
    if (!currentUserId) {
      toast.error("Bitte melde dich an");
      return;
    }
    setCopying(true);
    try {
      const copy = await copyRecipeToCollection(recipe.id);
      toast.success("Rezept übernommen!");
      router.push(`/recipes/${copy.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Übernehmen");
    } finally {
      setCopying(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/recipe/${recipe.slug}`;
    try {
      const result = await shareOrCopy({
        title: recipe.title,
        text: `Schau dir dieses Rezept an: ${recipe.title}`,
        url,
      });
      toast.success(result === "shared" ? "Geteilt!" : "Link kopiert!");
    } catch {
      // User cancelled share sheet
    }
  }

  if (cookMode) {
    return (
      <CookMode
        steps={recipe.steps}
        ingredients={recipe.ingredients}
        servings={recipe.servings}
        title={recipe.title}
        onClose={() => setCookMode(false)}
      />
    );
  }

  return (
    <article
      className={cn(
        "animate-fade-in md:pb-0",
        isPublicView
          ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
          : "pb-[calc(9rem+env(safe-area-inset-bottom))]"
      )}
    >
      <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:mb-8 sm:aspect-[16/9] sm:rounded-2xl md:aspect-[21/9]">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Kein Bild
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {recipe.category && (
              <Badge variant="secondary">{recipe.category.name}</Badge>
            )}
            {recipe.custom_category && (
              <Badge variant="secondary">{recipe.custom_category.name}</Badge>
            )}
            {recipe.tags?.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.tag}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="mt-2 text-muted-foreground">{recipe.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.cook_time_minutes} Min.
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {recipe.servings} Portionen
            </span>
            <span>{DIFFICULTY_LABELS[recipe.difficulty]}</span>
            {recipe.author && (
              <span>von {recipe.author.display_name}</span>
            )}
          </div>
        </div>

        <div className="hidden flex-wrap gap-2 md:flex">
          {!isPublicView && isOwner && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/recipes/${recipe.id}/edit`}>
                  <Edit className="mr-1 h-4 w-4" />
                  Bearbeiten
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1 h-4 w-4" />
                Löschen
              </Button>
            </>
          )}
          {canCopyToCollection && (
            <Button size="sm" onClick={handleCopy} disabled={copying}>
              {copying ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-1 h-4 w-4" />
              )}
              In meine Sammlung übernehmen
            </Button>
          )}
          {userCopyId && !isOwner && (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/recipes/${userCopyId}`}>
                In deiner Sammlung ansehen
              </Link>
            </Button>
          )}
          {currentUserId && !isPublicView && (
            <AddToMealPlanDialog
              recipeId={recipe.id}
              recipeTitle={recipe.title}
              defaultServings={recipe.servings}
            />
          )}
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-1 h-4 w-4" />
            Teilen
          </Button>
          <Button size="sm" onClick={() => setCookMode(true)}>
            <ChefHat className="mr-1 h-4 w-4" />
            Kochmodus
          </Button>
        </div>
      </div>

      {currentUserId && !isPublicView && (
        <Button
          variant={favorited ? "default" : "outline"}
          className="mb-4 h-11 w-full sm:mb-6 sm:w-auto"
          onClick={handleFavorite}
        >
          <Heart
            className={cn("mr-2 h-4 w-4", favorited && "fill-current")}
          />
          {favorited ? "In deinen Favoriten" : "Zu Favoriten hinzufügen"}
        </Button>
      )}

      {!isPublicView && isOwner && (
        <div className="mb-4 flex flex-wrap gap-2 md:hidden">
          <AddToMealPlanDialog
            recipeId={recipe.id}
            recipeTitle={recipe.title}
            defaultServings={recipe.servings}
            className="flex-1"
          />
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/recipes/${recipe.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {canCopyToCollection && (
        <div className="mb-4 md:hidden">
          <Button className="w-full" onClick={handleCopy} disabled={copying}>
            {copying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            In meine Sammlung übernehmen
          </Button>
        </div>
      )}

      {userCopyId && !isOwner && (
        <div className="mb-4 md:hidden">
          <Button variant="secondary" className="w-full" asChild>
            <Link href={`/recipes/${userCopyId}`}>In deiner Sammlung ansehen</Link>
          </Button>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <StarRating
          value={userRating || Math.round(recipe.average_rating)}
          onChange={handleRate}
          readonly={!currentUserId}
        />
        <span className="text-sm text-muted-foreground">
          {recipe.average_rating > 0
            ? `${recipe.average_rating.toFixed(1)} (${recipe.rating_count} Bewertungen)`
            : "Noch keine Bewertungen"}
        </span>
      </div>

      <Separator className="my-8" />

      {!isPublicView && isOwner && (
        <RecipeVariants variants={variants} originalId={recipe.id} />
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Zutaten</h2>
          <PortionCalculator
            ingredients={recipe.ingredients}
            originalServings={recipe.servings}
          />
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Zubereitung</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <p className="pt-1">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <Separator className="my-8" />

      <CommentsSection
        recipeId={recipe.id}
        comments={comments}
        currentUserId={currentUserId}
      />

      {recipe.is_public && (
        <div className="mt-8 rounded-xl bg-secondary/50 p-4 text-center text-sm text-muted-foreground">
          <ExternalLink className="mx-auto mb-2 h-5 w-5" />
          <p className="mb-1">Öffentliche URL</p>
          <Link
            href={`/recipe/${recipe.slug}`}
            className="break-all font-medium text-primary underline-offset-4 hover:underline"
          >
            /recipe/{recipe.slug}
          </Link>
        </div>
      )}

      <div
        className={cn(
          "fixed inset-x-0 z-40 flex items-center gap-2 border-t border-border/60 bg-background/95 p-3 backdrop-blur-lg md:hidden",
          isPublicView
            ? "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
            : "bottom-[calc(4rem+env(safe-area-inset-bottom))]"
        )}
      >
        <Button className="h-11 flex-1" onClick={() => setCookMode(true)}>
          <ChefHat className="mr-2 h-4 w-4" />
          Kochmodus
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={handleShare}
          aria-label="Teilen"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        {canCopyToCollection && (
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={handleCopy}
            disabled={copying}
            aria-label="In Sammlung übernehmen"
          >
            {copying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
        {currentUserId && !isPublicView && (
          <Button
            variant={favorited ? "default" : "outline"}
            className="h-11 shrink-0 px-3"
            onClick={handleFavorite}
          >
            <Heart
              className={cn("mr-1.5 h-4 w-4", favorited && "fill-current")}
            />
            <span className="sr-only sm:not-sr-only">
              {favorited ? "Favorit" : "Merken"}
            </span>
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Rezept löschen?"
        description={
          <>
            „{recipe.title}“ wird unwiderruflich gelöscht. Das kann nicht rückgängig
            gemacht werden.
          </>
        }
        onConfirm={confirmDelete}
      />
    </article>
  );
}
