import { RecipeForm } from "@/components/recipes/recipe-form";
import { getUserCategories } from "@/lib/queries/categories";

export const metadata = { title: "Neues Rezept" };

export default async function NewRecipePage() {
  const userCategories = await getUserCategories();

  return (
    <div>
      <header className="page-header mb-5 md:mb-8">
        <h1 className="page-title">Neues Rezept</h1>
        <p className="page-subtitle">
          Manuell anlegen, Text einfügen, per Foto digitalisieren oder von einer Webseite importieren.
        </p>
      </header>
      <RecipeForm userCategories={userCategories} />
    </div>
  );
}
