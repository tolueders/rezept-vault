import { MAX_RECIPE_TEXT_LENGTH } from "@/lib/gemini/prompts";

const INGREDIENT_KEYWORDS = ["zutaten", "ingredients"];
const INSTRUCTION_KEYWORDS = [
  "zubereitung",
  "anleitung",
  "directions",
  "instructions",
  "schritt",
];

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  );
}

function isRecipeType(type: unknown): boolean {
  const types = Array.isArray(type) ? type : [type];
  return types.some(
    (value) =>
      value === "Recipe" ||
      value === "https://schema.org/Recipe" ||
      String(value).endsWith("/Recipe")
  );
}

function findRecipeNode(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;

  if (isRecipeType(obj["@type"])) return obj;

  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const found = findRecipeNode(item);
      if (found) return found;
    }
  }

  return null;
}

function flattenInstructions(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value.trim()].filter(Boolean);
  if (!Array.isArray(value)) {
    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.text === "string") return [obj.text.trim()].filter(Boolean);
      if (Array.isArray(obj.itemListElement)) {
        return flattenInstructions(obj.itemListElement);
      }
    }
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string") return item.trim() ? [item.trim()] : [];
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      if (typeof obj.text === "string") return obj.text.trim() ? [obj.text.trim()] : [];
      if (typeof obj.name === "string") return obj.name.trim() ? [obj.name.trim()] : [];
      if (Array.isArray(obj.itemListElement)) return flattenInstructions(obj.itemListElement);
    }
    return [];
  });
}

function findFirstKeywordIndex(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let index = -1;

  for (const keyword of keywords) {
    const match = lower.indexOf(keyword);
    if (match !== -1 && (index === -1 || match < index)) {
      index = match;
    }
  }

  return index;
}

function extractJsonLdRecipeSnippet(html: string): string | null {
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim()) as unknown;
      const nodes = Array.isArray(data) ? data : [data];

      for (const node of nodes) {
        const recipe = findRecipeNode(node);
        if (!recipe) continue;

        const compact = {
          title: recipe.name,
          description:
            typeof recipe.description === "string"
              ? recipe.description.slice(0, 1200)
              : "",
          servings: recipe.recipeYield,
          cook_time_minutes: recipe.totalTime ?? recipe.cookTime,
          ingredients: recipe.recipeIngredient,
          steps: flattenInstructions(recipe.recipeInstructions),
        };

        const json = JSON.stringify(compact);
        if (json.length >= 40) {
          return json.slice(0, MAX_RECIPE_TEXT_LENGTH);
        }
      }
    } catch {
      // Ungültiges JSON-LD ignorieren
    }
  }

  return null;
}

function focusRecipeSection(text: string): string | null {
  const ingredientIndex = findFirstKeywordIndex(text, INGREDIENT_KEYWORDS);
  const instructionIndex = findFirstKeywordIndex(text, INSTRUCTION_KEYWORDS);

  if (ingredientIndex === -1 && instructionIndex === -1) {
    return null;
  }

  const start = Math.max(
    0,
    (ingredientIndex === -1 ? instructionIndex : ingredientIndex) - 800
  );
  const end =
    instructionIndex === -1
      ? Math.min(text.length, start + MAX_RECIPE_TEXT_LENGTH)
      : Math.min(text.length, instructionIndex + MAX_RECIPE_TEXT_LENGTH);

  return text.slice(start, end).trim();
}

/** Liefert möglichst wenig, aber rezeptrelevanten Text für Gemini. */
export function extractRecipeTextForGemini(html: string): string {
  const jsonLd = extractJsonLdRecipeSnippet(html);
  if (jsonLd) return jsonLd;

  const plain = stripHtml(html);
  const focused = focusRecipeSection(plain);
  return (focused ?? plain).slice(0, MAX_RECIPE_TEXT_LENGTH);
}
