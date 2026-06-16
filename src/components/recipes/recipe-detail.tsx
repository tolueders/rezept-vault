"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Clock,
  Copy,
  Edit,
  Heart,
  Link2,
  Share2,
  Trash2,
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
import { AddToMealPlanDialog } from "@/components/recipes/add-to-meal-plan-dialog";
import { RecipeDetailHero } from "@/components/recipes/recipe-detail-hero";
import { RecipeVariants } from "@/components/recipes/recipe-variants";
import {
  toggleFavorite,
  rateRecipe,
  deleteRecipe,
  copyRecipeToCollection,
  publishRecipe,
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
  publicPublishBlockedReason?: string | null;
}

export function RecipeDetail({
  recipe,
  comments,
  currentUserId,
  isOwner,
  isPublicView = false,
  userCopyId = null,
  variants = [],
  publicPublishBlockedReason = null,
}: RecipeDetailProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(recipe.is_favorited || false);
  const [userRating, setUserRating] = useState(recipe.user_rating || 0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [publicLinkCopied, setPublicLinkCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.is_public);
  const [publishing, setPublishing] = useState(false);

  const cookHref = isPublicView
    ? `/recipe/${recipe.slug}/cook`
    : `/recipes/${recipe.id}/cook`;

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

  async function handleCopyPublicLink() {
    const url = `${window.location.origin}/recipe/${recipe.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setPublicLinkCopied(true);
      toast.success("Öffentlicher Link kopiert");
      window.setTimeout(() => setPublicLinkCopied(false), 2500);
    } catch {
      toast.error("Link konnte nicht kopiert werden");
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await publishRecipe(recipe.id);
      setIsPublic(true);
      toast.success("Rezept veröffentlicht");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Veröffentlichen");
    } finally {
      setPublishing(false);
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

  return (
    <article
      className={cn(
        "animate-fade-in min-w-0 md:pb-0",
        isPublicView
          ? "pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
      )}
    >
      <RecipeDetailHero
        recipeId={recipe.id}
        title={recipe.title}
        imageUrl={recipe.image_url}
        canUpload={!isPublicView && isOwner}
      />

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
          <Button size="sm" asChild>
            <Link href={cookHref}>
              <ChefHat className="mr-1 h-4 w-4" />
              Kochmodus
            </Link>
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

      <Button className="mb-8 h-11 w-full rounded-xl md:hidden" asChild>
        <Link href={cookHref}>
          <ChefHat className="mr-2 h-4 w-4 shrink-0" />
          Kochmodus
        </Link>
      </Button>

      <CommentsSection
        recipeId={recipe.id}
        comments={comments}
        currentUserId={currentUserId}
      />

      <div className="mt-8 space-y-4 mb-2">
        {!isPublicView && isOwner && !isPublic && (
          <div className="rounded-2xl border border-border/50 bg-card p-4 text-center shadow-sm sm:p-5">
            {publicPublishBlockedReason ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {publicPublishBlockedReason}
                </p>
                <Button className="mt-4 h-10 w-full rounded-xl sm:w-auto sm:min-w-[240px]" asChild>
                  <Link href={`/recipes/${recipe.id}/edit`}>Rezept bearbeiten</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Teilen ist erst möglich, wenn das Rezept öffentlich ist.
                </p>
                <Button
                  className="mt-4 h-10 w-full rounded-xl sm:w-auto sm:min-w-[240px]"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird veröffentlicht…
                    </>
                  ) : (
                    "Veröffentlichen"
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {isPublic && isOwner && !isPublicView && (
          <div className="flex gap-2">
            <Button
              variant={publicLinkCopied ? "secondary" : "outline"}
              className="h-11 min-w-0 flex-1 rounded-xl"
              onClick={handleCopyPublicLink}
            >
              {publicLinkCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4 shrink-0" />
                  Link kopiert
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4 shrink-0" />
                  Link kopieren
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-11 min-w-0 flex-1 rounded-xl"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4 shrink-0" />
              Teilen
            </Button>
          </div>
        )}

        {(isPublicView || (isPublic && !isOwner)) && (
          <Button
            variant="outline"
            className="h-11 w-full rounded-xl md:hidden"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4 shrink-0" />
            Teilen
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
