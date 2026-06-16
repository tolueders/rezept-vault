import Link from "next/link";
import Image from "next/image";
import { Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RecipeCardTitle } from "@/components/recipes/recipe-card-title";
import { DIFFICULTY_LABELS, MAX_RECIPE_TAGS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Recipe, RecipeCategory, RecipeTag, CustomCategory } from "@/types/database";

interface RecipeCardProps {
  recipe: Recipe & {
    category?: Pick<RecipeCategory, "id" | "name" | "slug"> | null;
    custom_category?: Pick<CustomCategory, "id" | "name" | "slug"> | null;
    tags?: Pick<RecipeTag, "id" | "tag">[];
  };
  variant?: "default" | "compact";
}

function RecipeCardMeta({
  recipe,
  tags,
  compact = false,
  className,
}: {
  recipe: RecipeCardProps["recipe"];
  tags: Pick<RecipeTag, "id" | "tag">[];
  compact?: boolean;
  className?: string;
}) {
  const visibleTags = tags.slice(0, MAX_RECIPE_TAGS);

  return (
    <p
      className={cn(
        "flex w-full min-w-0 items-center gap-x-0 overflow-hidden text-muted-foreground",
        compact ? "text-[11px] sm:text-xs" : "min-h-5 text-sm",
        className
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
        <Clock className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        {recipe.cook_time_minutes} Min.
      </span>
      <span className="shrink-0 px-1.5 text-border/80">·</span>
      <span className="shrink-0 whitespace-nowrap">
        {DIFFICULTY_LABELS[recipe.difficulty]}
      </span>
      {recipe.rating_count > 0 && (
        <>
          <span className="shrink-0 px-1.5 text-border/80">·</span>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
            <Star
              className={cn(
                "shrink-0 fill-primary text-primary",
                compact ? "h-3 w-3" : "h-3.5 w-3.5"
              )}
            />
            {recipe.average_rating.toFixed(1)}
          </span>
        </>
      )}
      {visibleTags.length > 0 && (
        <span className="min-w-0 truncate">
          {visibleTags.map((tag) => (
            <span key={tag.id}>
              <span className="px-1.5 text-border/80">·</span>
              {tag.tag}
            </span>
          ))}
        </span>
      )}
    </p>
  );
}

export function RecipeCard({ recipe, variant = "default" }: RecipeCardProps) {
  const categoryName = recipe.category?.name || recipe.custom_category?.name;
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
      <Link href={`/recipes/${recipe.id}`} className="block min-w-0">
        <div className="recipe-card flex h-24 min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm ring-1 ring-foreground/[0.06] sm:h-28">
          <div className="relative h-full w-24 shrink-0 overflow-hidden bg-muted sm:w-28">
            {image}
            {categoryName && (
              <Badge className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate bg-background/90 px-1.5 py-0 text-[10px] text-foreground">
                {categoryName}
              </Badge>
            )}
          </div>
          <div className="@container/recipe-card flex min-w-0 flex-1 flex-col justify-center overflow-hidden px-3.5 pt-3.5 pb-2 sm:px-4 sm:pt-4 sm:pb-2.5">
            <div className="flex w-full flex-col gap-1 sm:gap-1.5">
              <RecipeCardTitle title={recipe.title} compact />
              <RecipeCardMeta recipe={recipe} tags={tags} compact />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="recipe-card overflow-hidden border-border/50 py-0 shadow-sm">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {image}
          {categoryName && (
            <Badge className="absolute left-3 top-3 bg-background/90 text-foreground">
              {categoryName}
            </Badge>
          )}
        </div>
        <CardContent className="@container/recipe-card flex min-h-[6.5rem] flex-col justify-center px-4 py-4 sm:min-h-[7rem] sm:p-5">
          <div className="flex w-full flex-col gap-2">
            <RecipeCardTitle title={recipe.title} />
            <RecipeCardMeta recipe={recipe} tags={tags} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
