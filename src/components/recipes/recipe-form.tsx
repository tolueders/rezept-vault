"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RecipeVisibilityToggle } from "@/components/recipes/recipe-visibility-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  RecipeImportPanel,
  type ImportMode,
} from "@/components/recipes/recipe-import-panel";
import { recipeSchema, type RecipeFormValues } from "@/lib/validations/auth";
import { createRecipe, updateRecipe, createVariant } from "@/lib/actions/recipes";
import { uploadRecipeImage } from "@/lib/actions/profile";
import {
  scanRecipePhoto,
  scanRecipeText,
  scanRecipeUrl,
} from "@/lib/resolve-scan.client";
import { normalizeRecipeExtraction } from "@/lib/recipe-extraction-utils";
import { DIFFICULTY_LABELS, MAX_RECIPE_TAGS } from "@/lib/constants";
import type {
  CustomCategory,
  GeminiRecipeExtraction,
  RecipeCategory,
  RecipeWithDetails,
} from "@/types/database";
import { toast } from "sonner";

const ImageUploader = dynamic(
  () =>
    import("@/components/recipes/image-uploader").then((mod) => mod.ImageUploader),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[4/3] animate-pulse items-center justify-center rounded-xl bg-secondary/40 sm:aspect-video">
        <span className="text-sm text-muted-foreground">Bild-Upload wird geladen…</span>
      </div>
    ),
  }
);

const numberFieldOptions = {
  valueAsNumber: true,
  setValueAs: (value: string | number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  },
} as const;

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
  const [importText, setImportText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    recipe?.image_url || null
  );
  const [analysisPhotoPreview, setAnalysisPhotoPreview] = useState<string | null>(
    null
  );
  const [tagInput, setTagInput] = useState("");
  const [importTab, setImportTab] = useState<ImportMode>("manual");
  const scanMemoryRef = useRef(new Map<string, GeminiRecipeExtraction>());

  const showHeroUploader = mode !== "create" || importTab !== "photo";

  const defaultValues: RecipeFormValues = {
    title: recipe?.title || "",
    description: recipe?.description || "",
    category_id: recipe?.custom_category_id ? undefined : recipe?.category_id || categories[0]?.id || "",
    custom_category_id: recipe?.custom_category_id || undefined,
    servings: recipe?.servings || 4,
    cook_time_minutes: recipe?.cook_time_minutes || 30,
    difficulty: recipe?.difficulty || "mittel",
    is_public: recipe?.is_public || false,
    tags: recipe?.tags?.map((t) => t.tag).slice(0, MAX_RECIPE_TAGS) || [],
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

  const categoryItems = useMemo(
    () => [
      ...categories.map((cat) => ({ value: `std:${cat.id}`, label: cat.name })),
      ...customCategories.map((cat) => ({
        value: `custom:${cat.id}`,
        label: `${cat.name} (eigen)`,
      })),
    ],
    [categories, customCategories]
  );

  const categoryId = form.watch("category_id");
  const customCategoryId = form.watch("custom_category_id");
  const categoryValue = customCategoryId
    ? `custom:${customCategoryId}`
    : categoryId || categories[0]?.id
      ? `std:${categoryId || categories[0]?.id}`
      : null;

  useEffect(() => {
    if (!categoryId && !customCategoryId && categories[0]?.id) {
      form.setValue("category_id", categories[0].id, { shouldValidate: true });
    }
  }, [categories, categoryId, customCategoryId, form]);

  function handleCategoryChange(v: string | null) {
    if (!v) return;
    if (v.startsWith("custom:")) {
      form.setValue("custom_category_id", v.slice(7), { shouldValidate: true, shouldDirty: true });
      form.setValue("category_id", "", { shouldValidate: true });
    } else {
      form.setValue("category_id", v.slice(4), { shouldValidate: true, shouldDirty: true });
      form.setValue("custom_category_id", "", { shouldValidate: true });
    }
  }

  function applyExtraction(raw: Parameters<typeof normalizeRecipeExtraction>[0]) {
    const data = normalizeRecipeExtraction(raw);
    const customCategoryId = form.getValues("custom_category_id");
    const categoryId = customCategoryId
      ? undefined
      : form.getValues("category_id") || categories[0]?.id || "";

    form.reset({
      title: data.title,
      description: data.description || "",
      category_id: categoryId,
      custom_category_id: customCategoryId,
      servings: data.servings,
      cook_time_minutes: data.cook_time_minutes,
      difficulty: data.difficulty,
      is_public: false,
      tags: [],
      ingredients: data.ingredients,
      steps: data.steps,
    });
  }

  function getFirstValidationMessage(errors: FieldErrors<RecipeFormValues>): string {
    if (errors.title?.message) return String(errors.title.message);
    if (errors.category_id?.message) return String(errors.category_id.message);
    if (errors.ingredients?.message) return String(errors.ingredients.message);
    if (errors.steps?.message) return String(errors.steps.message);

    const ingredientError = errors.ingredients;
    if (Array.isArray(ingredientError)) {
      for (const item of ingredientError) {
        if (item?.name?.message) return String(item.name.message);
      }
    }

    const stepError = errors.steps;
    if (Array.isArray(stepError)) {
      for (const item of stepError) {
        if (item?.instruction?.message) return String(item.instruction.message);
      }
    }

    return "Bitte alle Pflichtfelder ausfüllen";
  }

  function onInvalid(errors: FieldErrors<RecipeFormValues>) {
    toast.error("Rezept unvollständig", {
      description: getFirstValidationMessage(errors),
    });
  }

  async function handleTextImport() {
    if (importText.trim().length < 20) return;
    setAnalyzing(true);
    try {
      const { data, fromCache } = await scanRecipeText(
        importText,
        scanMemoryRef.current
      );
      applyExtraction(data);
      toast.success(fromCache ? "Rezept aus Cache geladen" : "Rezept erkannt!", {
        description: "Bitte prüfe und bearbeite die extrahierten Daten.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Text-Import fehlgeschlagen");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleUrlImport() {
    if (!importUrl.trim()) return;
    setAnalyzing(true);
    try {
      const { data, fromCache } = await scanRecipeUrl(
        importUrl,
        scanMemoryRef.current
      );
      applyExtraction(data);
      toast.success(fromCache ? "Rezept aus Cache geladen" : "Rezept importiert!", {
        description: "Bitte prüfe und bearbeite die extrahierten Daten.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Link-Import fehlgeschlagen");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePhotoAnalysis(file: File) {
    setAnalyzing(true);
    try {
      const { data, fromCache, previewUrl } = await scanRecipePhoto(
        file,
        scanMemoryRef.current
      );
      applyExtraction(data);
      setAnalysisPhotoPreview(previewUrl);
      toast.success(fromCache ? "Foto bereits analysiert" : "Rezept erkannt!", {
        description: "Bitte prüfe und bearbeite die extrahierten Daten.",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Bildanalyse fehlgeschlagen"
      );
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
    if (current.length >= MAX_RECIPE_TAGS) {
      toast.error(`Maximal ${MAX_RECIPE_TAGS} Tags erlaubt`);
      return;
    }
    if (!current.includes(tag)) {
      form.setValue("tags", [...current, tag]);
    }
    setTagInput("");
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="recipe-form mx-auto max-w-3xl space-y-5 pb-4 md:space-y-8"
    >
      {mode === "create" && (
        <RecipeImportPanel
          mode={importTab}
          onModeChange={setImportTab}
          analyzing={analyzing}
          importText={importText}
          onImportTextChange={setImportText}
          onTextImport={handleTextImport}
          importUrl={importUrl}
          onImportUrlChange={setImportUrl}
          onUrlImport={handleUrlImport}
          imagePreview={analysisPhotoPreview}
          onPhotoSelect={handlePhotoAnalysis}
        />
      )}

      {showHeroUploader && (
        <section className="form-section">
          <h2 className="form-section-title">Hauptbild</h2>
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
        </section>
      )}

      <section className="form-section space-y-4">
        <h2 className="form-section-title">Grunddaten</h2>

        <div className="space-y-2">
          <Label>Sichtbarkeit</Label>
          <RecipeVisibilityToggle
            value={form.watch("is_public")}
            onChange={(isPublic) => form.setValue("is_public", isPublic)}
          />
        </div>

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
              onValueChange={handleCategoryChange}
              items={categoryItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={`std:${cat.id}`}>
                    {cat.name}
                  </SelectItem>
                ))}
                {customCategories.map((cat) => (
                  <SelectItem key={cat.id} value={`custom:${cat.id}`}>
                    {cat.name} (eigen)
                  </SelectItem>
                ))}
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
                v && form.setValue("difficulty", v as RecipeFormValues["difficulty"], { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
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
              {...form.register("servings", {
                ...numberFieldOptions,
                setValueAs: (value: string | number) => {
                  const parsed = Number(value);
                  return Number.isFinite(parsed) ? parsed : 1;
                },
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cook_time">Kochzeit (Min.)</Label>
            <Input
              id="cook_time"
              type="number"
              min={0}
              {...form.register("cook_time_minutes", numberFieldOptions)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags (max. {MAX_RECIPE_TAGS})</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="z.B. Vegan, Schnell…"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="flex-1"
              disabled={form.watch("tags").length >= MAX_RECIPE_TAGS}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addTag}
              className="sm:shrink-0"
              disabled={form.watch("tags").length >= MAX_RECIPE_TAGS}
            >
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
      </section>

      <section className="form-section space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="form-section-title mb-0">Zutaten</h2>
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
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-xl border border-border/40 bg-secondary/20 p-3 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0"
          >
            <Input
              placeholder="Zutat"
              {...form.register(`ingredients.${index}.name`)}
              className="flex-[2] bg-background"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Menge"
                {...form.register(`ingredients.${index}.amount`, numberFieldOptions)}
                className="w-full flex-1 bg-background sm:w-24"
              />
              <Input
                placeholder="Einheit"
                {...form.register(`ingredients.${index}.unit`)}
                className="w-full flex-1 bg-background sm:w-24"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => removeIngredient(index)}
                disabled={ingredientFields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {form.formState.errors.ingredients?.message && (
          <p className="text-sm text-destructive">
            {form.formState.errors.ingredients.message}
          </p>
        )}
      </section>

      <section className="form-section space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="form-section-title mb-0">Zubereitung</h2>
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
          <div
            key={field.id}
            className="flex gap-3 rounded-xl border border-border/40 bg-secondary/20 p-3 sm:border-0 sm:bg-transparent sm:p-0"
          >
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <Textarea
              placeholder={`Schritt ${index + 1}`}
              {...form.register(`steps.${index}.instruction`)}
              className="min-h-[4.5rem] flex-1 bg-background"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 self-start"
              onClick={() => removeStep(index)}
              disabled={stepFields.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {form.formState.errors.steps?.message && (
          <p className="text-sm text-destructive">
            {form.formState.errors.steps.message}
          </p>
        )}
      </section>

      <div className="form-submit-bar flex gap-3 pb-4 md:pb-8">
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
