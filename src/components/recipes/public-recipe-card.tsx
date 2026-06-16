import Link from "next/link";
import Image from "next/image";
import { Clock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RecipeCardTitle } from "@/components/recipes/recipe-card-title";
import { DIFFICULTY_LABELS, MAX_RECIPE_TAGS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Recipe, RecipeCategory, RecipeTag } from "@/types/database";

interface PublicRecipeCardProps {
  recipe: Recipe & {
    category?: Pick<RecipeCategory, "id" | "name" | "slug"> | null;
    tags?: Pick<RecipeTag, "id" | "tag">[];
    author?: { display_name: string } | null;
  };
  variant?: "default" | "compact";
}

function PublicRecipeCardMeta({
  recipe,
  tags,
  author,
  compact = false,
}: {
  recipe: PublicRecipeCardProps["recipe"];
  tags: Pick<RecipeTag, "id" | "tag">[];
  author?: { display_name: string } | null;
  compact?: boolean;
}) {
  const visibleTags = tags.slice(0, MAX_RECIPE_TAGS);

  if (compact) {
    return (
      <p
        className={cn(
          "line-clamp-1 min-w-0 text-muted-foreground",
          "text-[11px] leading-4 sm:text-xs sm:leading-5"
        )}
      >
        <span className="whitespace-nowrap">{recipe.cook_time_minutes} Min.</span>
        <span className="px-1.5 text-border/80">·</span>
        <span className="whitespace-nowrap">
          {DIFFICULTY_LABELS[recipe.difficulty]}
        </span>
        {recipe.rating_count > 0 && (
          <>
            <span className="px-1.5 text-border/80">·</span>
            <span className="whitespace-nowrap">
              ★ {recipe.average_rating.toFixed(1)}
            </span>
          </>
        )}
        {visibleTags.map((tag) => (
          <span key={tag.id}>
            <span className="px-1.5 text-border/80">·</span>
            {tag.tag}
          </span>
        ))}
        {author?.display_name && (
          <>
            <span className="px-1.5 text-border/80">·</span>
            <span>von {author.display_name}</span>
          </>
        )}
      </p>
    );
  }

  return (
    <>
      {author && (
        <p className="mb-2 text-xs text-muted-foreground">von {author.display_name}</p>
      )}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {recipe.cook_time_minutes} Min.
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {recipe.servings}
        </span>
        {recipe.rating_count > 0 && (
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            {recipe.average_rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {DIFFICULTY_LABELS[recipe.difficulty]}
      </p>
    </>
  );
}

export function PublicRecipeCard({
  recipe,
  variant = "default",
}: PublicRecipeCardProps) {
  const categoryName = recipe.category?.name;
  const tags = recipe.tags ?? [];

  const image = (
    <>
      {recipe.image_url ? (
        <Image
          src={recipe.image_url}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes={
            variant === "compact"
              ? "(max-width: 768px) 96px, 112px"
              : "(max-width: 768px) 100vw, 33vw"
          }
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Kein Bild
        </div>
      )}
    </>
  );

  if (variant === "compact") {
    return (
      <Link href={`/recipe/${recipe.slug}`} className="block min-w-0">
        <div className="recipe-card flex h-24 min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm ring-1 ring-foreground/[0.06] sm:h-28">
          <div className="relative h-full w-24 shrink-0 overflow-hidden bg-muted sm:w-28">
            {image}
            {categoryName && (
              <Badge className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate bg-background/90 px-1.5 py-0 text-[10px] text-foreground">
                {categoryName}
              </Badge>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 overflow-hidden px-3 py-2.5 sm:gap-1.5 sm:px-4 sm:py-3">
            <RecipeCardTitle title={recipe.title} compact />
            <PublicRecipeCardMeta
              recipe={recipe}
              tags={tags}
              author={recipe.author}
              compact
            />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/recipe/${recipe.slug}`}>
      <Card className="recipe-card overflow-hidden border-border/60 py-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image}
          {categoryName && (
            <Badge className="absolute left-3 top-3 bg-background/90 text-foreground">
              {categoryName}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-1 line-clamp-2 text-lg font-semibold leading-tight">
            {recipe.title}
          </h3>
          <PublicRecipeCardMeta recipe={recipe} tags={tags} author={recipe.author} />
        </CardContent>
      </Card>
    </Link>
  );
}
