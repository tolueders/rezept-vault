"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/recipes/image-uploader";
import { recipeSchema, type RecipeFormValues } from "@/lib/validations/auth";
import { createRecipe, updateRecipe, createVariant } from "@/lib/actions/recipes";
import { uploadRecipeImage } from "@/lib/actions/profile";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import type { CustomCategory, RecipeCategory, RecipeWithDetails } from "@/types/database";
import { toast } from "sonner";

interface RecipeFormProps {
  categories: RecipeCategory[];
  customCategories?: CustomCategory[];
  recipe?: RecipeWithDetails;
  mode?: "create" | "edit" | "variant";
  originalRecipeId?: string;
}

export function RecipeForm({
  categories,
  customCategories = [],
  recipe,
  mode = "create",
  originalRecipeId,
}: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    recipe?.image_url || null
  );
  const [tagInput, setTagInput] = useState("");

  const defaultValues: RecipeFormValues = {
    title: recipe?.title || "",
    description: recipe?.description || "",
    category_id: recipe?.custom_category_id ? undefined : recipe?.category_id || categories[0]?.id || "",
    custom_category_id: recipe?.custom_category_id || undefined,
    servings: recipe?.servings || 4,
    cook_time_minutes: recipe?.cook_time_minutes || 30,
    difficulty: recipe?.difficulty || "mittel",
    is_public: recipe?.is_public || false,
    tags: recipe?.tags?.map((t) => t.tag) || [],
    ingredients: recipe?.ingredients?.length
      ? recipe.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit,
        }))
      : [{ name: "", amount: 0, unit: "" }],
    steps: recipe?.steps?.length
      ? recipe.steps.map((s) => ({ instruction: s.instruction }))
      : [{ instruction: "" }],
  };

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control: form.control, name: "ingredients" });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control: form.control, name: "steps" });

  const categoryValue = form.watch("custom_category_id")
    ? `custom:${form.watch("custom_category_id")}`
    : `std:${form.watch("category_id") || ""}`;

  function applyExtraction(data: {
    title: string;
    description?: string;
    servings?: number;
    cook_time_minutes?: number;
    difficulty?: RecipeFormValues["difficulty"];
    ingredients?: RecipeFormValues["ingredients"];
    steps?: RecipeFormValues["steps"];
  }) {
    form.reset({
      title: data.title,
      description: data.description || "",
      category_id: form.getValues("category_id"),
      custom_category_id: form.getValues("custom_category_id"),
      servings: data.servings || 4,
      cook_time_minutes: data.cook_time_minutes || 30,
      difficulty: data.difficulty || "mittel",
      is_public: false,
      tags: [],
      ingredients: data.ingredients?.length
        ? data.ingredients
        : [{ name: "", amount: 0, unit: "" }],
      steps: data.steps?.length ? data.steps : [{ instruction: "" }],
    });
  }

  async function handleUrlImport() {
    if (!importUrl.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import fehlgeschlagen");
      applyExtraction(data);
      toast.success("Rezept importiert!", {
        description: "Bitte prüfe und bearbeite die extrahierten Daten.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "URL-Import fehlgeschlagen");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePhotoAnalysis(file: File) {
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/analyze-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });

      if (!res.ok) throw new Error("Analyse fehlgeschlagen");
      const data = await res.json();

      applyExtraction(data);

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      toast.success("Rezept erkannt!", {
        description: "Bitte prüfe und bearbeite die extrahierten Daten.",
      });
    } catch {
      toast.error("Bildanalyse fehlgeschlagen");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onSubmit(data: RecipeFormValues) {
    setLoading(true);
    try {
      let imageUrl = recipe?.image_url || null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        imageUrl = await uploadRecipeImage(fd);
      }

      if (mode === "edit" && recipe) {
        await updateRecipe(recipe.id, data, imageUrl);
        toast.success("Rezept aktualisiert");
        router.push(`/recipes/${recipe.id}`);
      } else if (mode === "variant" && originalRecipeId) {
        const variant = await createVariant(
          originalRecipeId,
          data.title,
          data,
          imageUrl
        );
        toast.success("Variante erstellt");
        router.push(`/recipes/${variant.id}`);
      } else {
        const newRecipe = await createRecipe(data, imageUrl);
        toast.success("Rezept erstellt");
        router.push(`/recipes/${newRecipe.id}`);
      }
    } catch (err) {
      toast.error("Fehler beim Speichern", {
        description: err instanceof Error ? err.message : "Unbekannter Fehler",
      });
    } finally {
      setLoading(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    const current = form.getValues("tags");
    if (!current.includes(tag)) {
      form.setValue("tags", [...current, tag]);
    }
    setTagInput("");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-8">
      {mode === "create" && (
        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manuell</TabsTrigger>
            <TabsTrigger value="photo">Foto</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          <TabsContent value="photo" className="mt-4">
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
              <Camera className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                Lade ein Foto deines Rezepts hoch – KI extrahiert Titel, Zutaten und Schritte.
              </p>
              <Input
                type="file"
                accept="image/*"
                disabled={analyzing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoAnalysis(file);
                }}
              />
              {analyzing && (
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rezept wird analysiert…
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="url" className="mt-4">
            <div className="rounded-xl border-2 border-dashed border-border p-8">
              <Link2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Link zu einem Online-Rezept einfügen – KI extrahiert Titel, Zutaten und Schritte.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="url"
                  placeholder="https://www.chefkoch.de/rezept/…"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  disabled={analyzing}
                />
                <Button
                  type="button"
                  onClick={handleUrlImport}
                  disabled={analyzing || !importUrl.trim()}
                >
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Importieren"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <ImageUploader
        preview={imagePreview}
        onImageReady={(file, preview) => {
          setImageFile(file);
          setImagePreview(preview);
        }}
        onRemove={() => {
          setImageFile(null);
          setImagePreview(null);
        }}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titel</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea id="description" rows={3} {...form.register("description")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select
              value={categoryValue}
              onValueChange={(v) => {
                if (!v) return;
                if (v.startsWith("custom:")) {
                  form.setValue("custom_category_id", v.replace("custom:", ""));
                  form.setValue("category_id", undefined);
                } else {
                  form.setValue("category_id", v.replace("std:", ""));
                  form.setValue("custom_category_id", undefined);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={`std:${cat.id}`}>
                    {cat.name}
                  </SelectItem>
                ))}
                {customCategories.length > 0 && (
                  <>
                    {customCategories.map((cat) => (
                      <SelectItem key={cat.id} value={`custom:${cat.id}`}>
                        {cat.name} (eigen)
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.category_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.category_id.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Schwierigkeit</Label>
            <Select
              value={form.watch("difficulty")}
              onValueChange={(v) =>
                v && form.setValue("difficulty", v as RecipeFormValues["difficulty"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="servings">Portionen</Label>
            <Input
              id="servings"
              type="number"
              min={1}
              {...form.register("servings", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cook_time">Kochzeit (Min.)</Label>
            <Input
              id="cook_time"
              type="number"
              min={0}
              {...form.register("cook_time_minutes", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_public"
              checked={form.watch("is_public")}
              onCheckedChange={(checked) =>
                form.setValue("is_public", checked === true)
              }
            />
            <Label htmlFor="is_public" className="cursor-pointer">
              Rezept öffentlich teilen
            </Label>
          </div>
          <p className="pl-6 text-xs text-muted-foreground">
            Öffentliche Rezepte erscheinen unter Entdecken und können geteilt werden.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="z.B. Vegan, Schnell…"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Hinzufügen
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.watch("tags").map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() =>
                    form.setValue(
                      "tags",
                      form.getValues("tags").filter((t) => t !== tag)
                    )
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Zutaten</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendIngredient({ name: "", amount: 0, unit: "" })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Zutat
          </Button>
        </div>
        {ingredientFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input
              placeholder="Zutat"
              {...form.register(`ingredients.${index}.name`)}
              className="flex-[2]"
            />
            <Input
              type="number"
              placeholder="Menge"
              {...form.register(`ingredients.${index}.amount`, { valueAsNumber: true })}
              className="w-24"
            />
            <Input
              placeholder="Einheit"
              {...form.register(`ingredients.${index}.unit`)}
              className="w-24"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeIngredient(index)}
              disabled={ingredientFields.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Zubereitung</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendStep({ instruction: "" })}
          >
            <Plus className="mr-1 h-4 w-4" />
            Schritt
          </Button>
        </div>
        {stepFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <Textarea
              placeholder={`Schritt ${index + 1}`}
              {...form.register(`steps.${index}.instruction`)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeStep(index)}
              disabled={stepFields.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pb-8">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "edit" ? "Speichern" : mode === "variant" ? "Variante speichern" : "Rezept erstellen"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
