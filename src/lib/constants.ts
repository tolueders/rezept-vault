export const APP_NAME = "RezeptVault";

export const DIFFICULTY_LABELS = {
  einfach: "Einfach",
  mittel: "Mittel",
  schwer: "Schwer",
} as const;

export const MEAL_TYPE_LABELS = {
  fruehstueck: "Frühstück",
  mittagessen: "Mittagessen",
  abendessen: "Abendessen",
  snack: "Snack",
} as const;

export const WEEKDAYS = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

export const RECIPES_PER_PAGE = 12;

export const STORAGE_BUCKETS = {
  recipeImages: "recipe-images",
  avatars: "avatars",
} as const;

export const NAV_ITEMS = [
  { href: "/recipes", label: "Meine Rezepte", icon: "BookOpen" },
  { href: "/favorites", label: "Favoriten", icon: "Heart" },
  { href: "/meal-plan", label: "Wochenplanung", icon: "Calendar" },
  { href: "/shopping-list", label: "Einkaufsliste", icon: "ShoppingCart" },
  { href: "/profile", label: "Profil", icon: "User" },
] as const;
