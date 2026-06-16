import { cn } from "@/lib/utils";

interface RecipeCardTitleProps {
  title: string;
  compact?: boolean;
}

function getTitleSizeClass(title: string, compact: boolean) {
  const length = title.length;

  if (compact) {
    if (length <= 18) return "text-sm leading-snug";
    if (length <= 36) return "text-[13px] leading-snug";
    return "text-xs leading-snug";
  }

  if (length <= 22) return "text-base leading-6 sm:text-lg sm:leading-7";
  if (length <= 44) return "text-[15px] leading-6 sm:text-base";
  return "text-sm leading-5 sm:text-[15px] sm:leading-6";
}

export function RecipeCardTitle({ title, compact = false }: RecipeCardTitleProps) {
  return (
    <h3
      className={cn(
        "line-clamp-2 w-full min-w-0 font-semibold tracking-tight",
        getTitleSizeClass(title, compact)
      )}
    >
      {title}
    </h3>
  );
}
