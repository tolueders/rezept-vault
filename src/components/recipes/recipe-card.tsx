import Link from "next/link";
import Image from "next/image";
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
        "line-clamp-1 min-w-0 text-muted-foreground",
        compact ? "text-[11px] leading-4 sm:text-xs sm:leading-5" : "text-sm leading-5",
        className
      )}
    >
      <span className="whitespace-nowrap">
        {recipe.cook_time_minutes} Min.
      </span>
      <span className="px-1.5 text-border/80">·</span>
      <span className="whitespace-nowrap">{DIFFICULTY_LABELS[recipe.difficulty]}</span>
      {recipe.rating_count > 0 && (
        <>
          <span className="px-1.5 text-border/80">·</span>
          <span className="whitespace-nowrap">★ {recipe.average_rating.toFixed(1)}</span>
        </>
      )}
      {visibleTags.map((tag) => (
        <span key={tag.id}>
          <span className="px-1.5 text-border/80">·</span>
          {tag.tag}
        </span>
      ))}
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
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 overflow-hidden px-3 py-2.5 sm:gap-1.5 sm:px-4 sm:py-3">
            <RecipeCardTitle title={recipe.title} compact />
            <RecipeCardMeta recipe={recipe} tags={tags} compact />
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
        <CardContent className="flex min-h-[5.5rem] flex-col justify-center gap-2 px-4 py-4 sm:min-h-[6rem] sm:p-5">
          <RecipeCardTitle title={recipe.title} />
          <RecipeCardMeta recipe={recipe} tags={tags} />
        </CardContent>
      </Card>
    </Link>
  );
}
