import type { RecipeCategory, UserCategoryView } from "@/types/database";

export function standardCategoriesToUserViews(
  categories: RecipeCategory[]
): UserCategoryView[] {
  return categories.map((cat) => ({
    filterKey: `std:${cat.id}`,
    name: cat.name,
    slug: cat.slug,
    sortOrder: cat.sort_order,
    isCustom: false,
    canDelete: false,
    recipeCount: 0,
    standardCategoryId: cat.id,
    defaultName: cat.name,
  }));
}

export function buildUserCategoryViews(
  standard: RecipeCategory[],
  overrides: { recipe_category_id: string; name: string }[],
  custom: { id: string; name: string; slug: string }[],
  recipeCounts: {
    byStandard: Record<string, number>;
    byCustom: Record<string, number>;
  }
): UserCategoryView[] {
  const overrideMap = new Map(
    overrides.map((item) => [item.recipe_category_id, item.name])
  );

  const result: UserCategoryView[] = standard.map((cat) => ({
    filterKey: `std:${cat.id}`,
    name: overrideMap.get(cat.id) ?? cat.name,
    slug: cat.slug,
    sortOrder: cat.sort_order,
    isCustom: false,
    canDelete: false,
    recipeCount: recipeCounts.byStandard[cat.id] ?? 0,
    standardCategoryId: cat.id,
    defaultName: cat.name,
  }));

  for (const cat of custom) {
    result.push({
      filterKey: `custom:${cat.id}`,
      name: cat.name,
      slug: cat.slug,
      sortOrder: 100 + result.length,
      isCustom: true,
      canDelete: true,
      recipeCount: recipeCounts.byCustom[cat.id] ?? 0,
      customCategoryId: cat.id,
    });
  }

  return result.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "de"));
}

export function userCategoriesToFilterCategories(categories: UserCategoryView[]) {
  return categories.map((cat) => ({
    id: cat.filterKey,
    name: cat.name,
    slug: cat.slug,
    sort_order: cat.sortOrder,
    isCustom: cat.isCustom,
  }));
}

type RecipeWithCategoryFields = {
  category_id: string | null;
  custom_category_id: string | null;
  category?: { id: string; name: string; slug: string } | null;
  custom_category?: { id: string; name: string; slug: string } | null;
};

export function applyUserCategoryDisplayNames<T extends RecipeWithCategoryFields>(
  recipes: T[],
  userCategories: UserCategoryView[]
): T[] {
  const standardNames = new Map(
    userCategories
      .filter((cat) => cat.standardCategoryId)
      .map((cat) => [cat.standardCategoryId!, cat.name])
  );
  const customNames = new Map(
    userCategories
      .filter((cat) => cat.customCategoryId)
      .map((cat) => [cat.customCategoryId!, cat.name])
  );

  return recipes.map((recipe) => {
    const next = { ...recipe };
    if (recipe.category_id && recipe.category && standardNames.has(recipe.category_id)) {
      next.category = { ...recipe.category, name: standardNames.get(recipe.category_id)! };
    }
    if (
      recipe.custom_category_id &&
      recipe.custom_category &&
      customNames.has(recipe.custom_category_id)
    ) {
      next.custom_category = {
        ...recipe.custom_category,
        name: customNames.get(recipe.custom_category_id)!,
      };
    }
    return next;
  });
}
