"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
  Sparkles,
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
import { recipeSchema, type RecipeFormValues } from "@/lib/validations/auth";
import { createRecipe, updateRecipe, createVariant } from "@/lib/actions/recipes";
import { uploadRecipeImage } from "@/lib/actions/profile";
import { MAX_ANALYZE_BASE64_LENGTH } from "@/lib/image-mime";
import { normalizeRecipeExtraction } from "@/lib/recipe-extraction-utils";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import type { CustomCategory, RecipeCategory, RecipeWithDetails } from "@/types/database";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    recipe?.image_url || null
  );
  const [tagInput, setTagInput] = useState("");
  const [importTab, setImportTab] = useState("manual");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const showHeroUploader =
    mode !== "create" || importTab !== "photo" || Boolean(imagePreview);

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
      const { compressImage } = await import("@/lib/image-utils");
      const prepared = await compressImage(file);
      const mimeType = prepared.type || "image/jpeg";

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(prepared);
      });

      if (base64.length > MAX_ANALYZE_BASE64_LENGTH) {
        throw new Error("Bild zu groß. Bitte ein kleineres Foto wählen.");
      }

      const res = await fetch("/api/analyze-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Analyse fehlgeschlagen");

      applyExtraction(data);

      setImageFile(prepared);
      setImagePreview(URL.createObjectURL(prepared));
      toast.success("Rezept erkannt!", {
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
        <section className="form-import-card overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <Tabs value={importTab} onValueChange={setImportTab} defaultValue="manual">
            <div className="border-b border-border/40 p-3 md:p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary/80">
                Rezept hinzufügen
              </p>
              <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl bg-secondary/50 p-1">
                <TabsTrigger value="manual" className="h-full rounded-lg text-xs sm:text-sm">
                  Manuell
                </TabsTrigger>
                <TabsTrigger value="photo" className="h-full rounded-lg text-xs sm:text-sm">
                  Foto
                </TabsTrigger>
                <TabsTrigger value="url" className="h-full rounded-lg text-xs sm:text-sm">
                  URL
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="manual" className="px-4 py-5 md:px-6">
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                Trage Titel, Zutaten und Schritte unten selbst ein — oder wechsle zu{" "}
                <span className="font-medium text-foreground">Foto</span> bzw.{" "}
                <span className="font-medium text-foreground">URL</span>, um die KI nutzen.
              </p>
            </TabsContent>

            <TabsContent value="photo" className="px-4 py-5 md:px-6">
              {imagePreview && importTab === "photo" ? (
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Rezeptfoto"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    KI-Daten wurden übernommen. Prüfe das Formular unten.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={analyzing}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    Anderes Foto wählen
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center px-2 py-4 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Camera className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold">Rezept fotografieren</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    Lade ein Foto hoch — die KI erkennt Titel, Zutaten und Zubereitung.
                  </p>
                  <Button
                    type="button"
                    className="mt-5 w-full max-w-xs"
                    disabled={analyzing}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird analysiert…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Foto auswählen
                      </>
                    )}
                  </Button>
                </div>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={analyzing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoAnalysis(file);
                  e.target.value = "";
                }}
              />
            </TabsContent>

            <TabsContent value="url" className="px-4 py-5 md:px-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Link2 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold">Von Webseite importieren</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Link zu einem Online-Rezept einfügen — die KI übernimmt den Rest.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                <Input
                  type="url"
                  placeholder="https://www.chefkoch.de/rezept/…"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  disabled={analyzing}
                  className="h-11"
                />
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleUrlImport}
                  disabled={analyzing || !importUrl.trim()}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Import läuft…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Rezept importieren
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </section>
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="z.B. Vegan, Schnell…"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addTag} className="sm:shrink-0">
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
