import Link from "next/link";
import Image from "next/image";
import { Clock, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import type { Recipe, RecipeCategory, RecipeTag } from "@/types/database";

interface RecipeCardProps {
  recipe: Recipe & {
    category?: Pick<RecipeCategory, "id" | "name" | "slug"> | null;
    tags?: Pick<RecipeTag, "id" | "tag">[];
  };
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="recipe-card overflow-hidden border-border/60 py-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Kein Bild
            </div>
          )}
          {recipe.category && (
            <Badge className="absolute left-3 top-3 bg-background/90 text-foreground">
              {recipe.category.name}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight">
            {recipe.title}
          </h3>
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
        </CardContent>
      </Card>
    </Link>
  );
}
