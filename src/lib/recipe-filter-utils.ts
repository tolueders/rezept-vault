type RecipeCategoryFields = {
  category_id: string | null;
  custom_category_id: string | null;
};

export function normalizeCategoryFilters(
  filters?: string | string[]
): string[] {
  if (!filters) return [];
  const list = Array.isArray(filters) ? filters : [filters];
  return list.filter((filter) => filter && filter !== "all");
}

export function matchesCategoryFilter(
  recipe: RecipeCategoryFields,
  filter: string
): boolean {
  if (filter.startsWith("custom:")) {
    return recipe.custom_category_id === filter.slice(7);
  }
  if (filter.startsWith("std:")) {
    return recipe.category_id === filter.slice(4);
  }
  return recipe.category_id === filter;
}

export function filterByCategoryFilters<T extends RecipeCategoryFields>(
  items: T[],
  filters: string[]
): T[] {
  const active = normalizeCategoryFilters(filters);
  if (active.length === 0) return items;
  return items.filter((item) =>
    active.some((filter) => matchesCategoryFilter(item, filter))
  );
}

export function buildCategoryOrQuery(filters: string[]): string | null {
  const active = normalizeCategoryFilters(filters);
  if (active.length === 0) return null;

  const parts = active.map((filter) => {
    if (filter.startsWith("custom:")) {
      return `custom_category_id.eq.${filter.slice(7)}`;
    }
    if (filter.startsWith("std:")) {
      return `category_id.eq.${filter.slice(4)}`;
    }
    return `category_id.eq.${filter}`;
  });

  return parts.join(",");
}

export function applyCategoryFiltersToQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: string[]
) {
  const orFilter = buildCategoryOrQuery(filters);
  if (!orFilter) return query;
  return query.or(orFilter);
}
