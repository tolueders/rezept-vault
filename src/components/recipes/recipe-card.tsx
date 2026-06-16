import Link from "next/link";
import Image from "next/image";
import { Clock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import type { Recipe, RecipeCategory, RecipeTag, CustomCategory } from "@/types/database";

interface RecipeCardProps {
  recipe: Recipe & {
    category?: Pick<RecipeCategory, "id" | "name" | "slug"> | null;
    custom_category?: Pick<CustomCategory, "id" | "name" | "slug"> | null;
    tags?: Pick<RecipeTag, "id" | "tag">[];
  };
  variant?: "default" | "compact";
}

export function RecipeCard({ recipe, variant = "default" }: RecipeCardProps) {
  const categoryName = recipe.category?.name || recipe.custom_category?.name;

  const meta = (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
        <div className="recipe-card flex min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm ring-1 ring-foreground/[0.06]">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-muted sm:h-28 sm:w-28">
            {image}
            {categoryName && (
              <Badge className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate bg-background/90 px-1.5 py-0 text-[10px] text-foreground">
                {categoryName}
              </Badge>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-4">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">
              {recipe.title}
            </h3>
            <div className="mt-1.5">{meta}</div>
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
        <CardContent className="p-4 sm:p-5">
          <h3 className="mb-2.5 line-clamp-2 text-base font-semibold leading-snug sm:text-lg">
            {recipe.title}
          </h3>
          {meta}
        </CardContent>
      </Card>
    </Link>
  );
}
