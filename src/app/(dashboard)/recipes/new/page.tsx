import { RecipeForm } from "@/components/recipes/recipe-form";
import { getCategories } from "@/lib/queries/recipes";
import { getCustomCategories } from "@/lib/queries/categories";

export const metadata = { title: "Neues Rezept" };

export default async function NewRecipePage() {
  const [categories, customCategories] = await Promise.all([
    getCategories(),
    getCustomCategories(),
  ]);

  return (
    <div>
      <header className="page-header mb-5 md:mb-8">
        <h1 className="page-title">Neues Rezept</h1>
        <p className="page-subtitle">
          Manuell anlegen, per Foto digitalisieren oder von einer Webseite importieren.
        </p>
      </header>
      <RecipeForm categories={categories} customCategories={customCategories} />
    </div>
  );
}
