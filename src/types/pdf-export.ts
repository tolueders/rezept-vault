import type { DifficultyLevel } from "@/types/database";

export interface PdfExportRecipe {
  id: string;
  title: string;
  description: string | null;
  servings: number;
  cook_time_minutes: number;
  difficulty: DifficultyLevel;
  average_rating: number;
  category: { name: string } | null;
  custom_category: { name: string } | null;
  tags: { tag: string }[];
  ingredients: { name: string; amount: number; unit: string; sort_order: number }[];
  steps: { instruction: string; sort_order: number }[];
  comments: { content: string; created_at: string }[];
  ratings: { rating: number }[];
}
