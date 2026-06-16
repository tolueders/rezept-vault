import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import type { PdfExportRecipe } from "@/types/pdf-export";
import { APP_NAME, DIFFICULTY_LABELS } from "@/lib/constants";
import { formatAmount } from "@/lib/recipe-utils";

const COLORS = {
  green: "#6B8F5E",
  brown: "#2C1A0E",
  beige: "#E8DDD0",
};

const CONTENT_WIDTH = 515;

function formatExportDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCategoryName(recipe: PdfExportRecipe): string {
  return recipe.category?.name || recipe.custom_category?.name || "Sonstiges";
}

function getAverageRating(recipe: PdfExportRecipe): number {
  if (recipe.ratings.length > 0) {
    const sum = recipe.ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / recipe.ratings.length;
  }
  return recipe.average_rating ?? 0;
}

function formatRating(rating: number): string {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)} (${rounded}/5)`;
}

function groupByCategory(recipes: PdfExportRecipe[]): Map<string, PdfExportRecipe[]> {
  const groups = new Map<string, PdfExportRecipe[]>();
  for (const recipe of recipes) {
    const category = getCategoryName(recipe);
    const list = groups.get(category) ?? [];
    list.push(recipe);
    groups.set(category, list);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "de")));
}

/** Nur für TOC sichtbar – kein sichtbarer Text im Dokument */
function tocOnlyEntry(
  label: string,
  options: { indent?: number; bold?: boolean } = {}
): Content {
  return {
    text: label,
    tocItem: true,
    tocStyle: {
      fontSize: options.bold ? 12 : 10,
      bold: options.bold,
      color: COLORS.brown,
    },
    tocMargin: [options.indent ?? 0, options.bold ? 6 : 2, 0, 2],
    fontSize: 0,
    lineHeight: 0.1,
    margin: [0, 0, 0, 0],
    color: COLORS.beige,
  };
}

function buildRecipePage(recipe: PdfExportRecipe): Content[] {
  const category = getCategoryName(recipe);
  const blocks: Content[] = [
    {
      text: category,
      style: "categoryBadge",
      margin: [0, 0, 0, 10],
    },
    {
      columns: [
        { text: recipe.title, style: "recipeTitle", width: "*" },
        {
          text: formatRating(getAverageRating(recipe)),
          style: "stars",
          width: "auto",
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 6],
    },
  ];

  if (recipe.description?.trim()) {
    blocks.push({
      text: recipe.description.trim(),
      style: "recipeDescription",
      margin: [0, 0, 0, 10],
    });
  }

  blocks.push({
    text: `Kochzeit: ${recipe.cook_time_minutes} Min.  |  Portionen: ${recipe.servings}  |  ${DIFFICULTY_LABELS[recipe.difficulty]}`,
    style: "metaLine",
    margin: [0, 0, 0, 10],
  });

  if (recipe.tags.length > 0) {
    blocks.push({
      text: recipe.tags.map((t) => t.tag).join("  ·  "),
      style: "tags",
      margin: [0, 0, 0, 12],
    });
  }

  blocks.push({
    canvas: [
      {
        type: "line",
        x1: 0,
        y1: 0,
        x2: CONTENT_WIDTH,
        y2: 0,
        lineWidth: 0.5,
        lineColor: COLORS.beige,
      },
    ],
    margin: [0, 0, 0, 12],
  });

  const ingredientLines = recipe.ingredients.map(
    (ing) => `${formatAmount(ing.amount, ing.unit)} ${ing.name}`
  );

  blocks.push({
    columns: [
      {
        width: "*",
        stack: [
          { text: "ZUTATEN", style: "sectionHeading" },
          {
            ul: ingredientLines,
            style: "bodyText",
            margin: [0, 6, 0, 0],
          },
        ],
      },
      { width: 20, text: "" },
      {
        width: "*",
        stack: [
          { text: "ZUBEREITUNG", style: "sectionHeading" },
          {
            ol: recipe.steps.map((s) => s.instruction),
            style: "bodyText",
            margin: [0, 6, 0, 0],
          },
        ],
      },
    ],
  });

  if (recipe.comments.length > 0) {
    blocks.push({
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: CONTENT_WIDTH,
          y2: 0,
          lineWidth: 0.5,
          lineColor: COLORS.beige,
        },
      ],
      margin: [0, 16, 0, 8],
    });
    blocks.push({ text: "KOMMENTARE", style: "sectionHeading", margin: [0, 0, 0, 6] });
    blocks.push({
      ul: recipe.comments.map(
        (c) => `"${c.content.trim()}" (${formatCommentDate(c.created_at)})`
      ),
      style: "bodyText",
    });
  }

  return blocks;
}

export function buildRecipesPdfDefinition(
  recipes: PdfExportRecipe[],
  userName: string,
  exportDate: Date
): TDocumentDefinitions {
  const grouped = groupByCategory(recipes);
  const dateLabel = formatExportDate(exportDate);

  const content: Content[] = [
    { text: "Meine Rezeptsammlung", style: "coverTitle", margin: [0, 100, 0, 14] },
    { text: `${userName} · ${dateLabel}`, style: "coverSubtitle", margin: [0, 0, 0, 20] },
    { text: `${recipes.length} Rezepte`, style: "coverCount", margin: [0, 0, 0, 28] },
    {
      canvas: [
        {
          type: "line",
          x1: 160,
          y1: 0,
          x2: 355,
          y2: 0,
          lineWidth: 2,
          lineColor: COLORS.green,
        },
      ],
    },
    { text: "", pageBreak: "after" },
    { text: "Inhaltsverzeichnis", style: "tocTitle", margin: [0, 0, 0, 16] },
    { toc: { title: { text: "" } }, pageBreak: "after" },
  ];

  for (const [category, categoryRecipes] of grouped) {
    content.push(tocOnlyEntry(category, { bold: true }));

    for (const recipe of categoryRecipes) {
      content.push(tocOnlyEntry(recipe.title, { indent: 16 }));
      content.push({
        pageBreak: "before",
        stack: buildRecipePage(recipe),
      });
    }
  }

  return {
    pageSize: "A4",
    pageMargins: [40, 50, 40, 55],
    defaultStyle: { font: "Roboto", color: COLORS.brown, fontSize: 10 },
    styles: {
      coverTitle: { fontSize: 28, bold: true, alignment: "center", color: COLORS.brown },
      coverSubtitle: { fontSize: 13, alignment: "center", color: COLORS.green },
      coverCount: { fontSize: 12, alignment: "center", color: COLORS.brown },
      tocTitle: { fontSize: 20, bold: true, color: COLORS.brown },
      categoryBadge: {
        fontSize: 9,
        bold: true,
        color: COLORS.green,
        background: COLORS.beige,
        margin: [0, 2, 0, 2],
      },
      recipeTitle: { fontSize: 18, bold: true, color: COLORS.brown },
      stars: { fontSize: 10, color: COLORS.green },
      recipeDescription: { fontSize: 10, italics: true },
      metaLine: { fontSize: 9, color: COLORS.green },
      tags: { fontSize: 9, color: COLORS.green },
      sectionHeading: { fontSize: 11, bold: true, color: COLORS.brown },
      bodyText: { fontSize: 10, lineHeight: 1.35 },
    },
    footer(currentPage, pageCount) {
      return {
        columns: [
          {
            text: `Erstellt mit ${APP_NAME} · ${dateLabel}`,
            fontSize: 8,
            color: COLORS.green,
          },
          {
            text: `${currentPage} / ${pageCount}`,
            fontSize: 8,
            color: COLORS.green,
            alignment: "right",
          },
        ],
        margin: [40, 0, 40, 18],
      };
    },
    content,
  };
}

export async function downloadRecipesPdf(
  recipes: PdfExportRecipe[],
  userName: string
): Promise<void> {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default as typeof pdfMakeModule.default & {
    vfs?: Record<string, string>;
  };
  const pdfFonts = pdfFontsModule.default as {
    pdfMake?: { vfs: Record<string, string> };
    vfs?: Record<string, string>;
  };

  pdfMake.vfs = pdfFonts.pdfMake?.vfs ?? pdfFonts.vfs ?? pdfMake.vfs;

  const docDefinition = buildRecipesPdfDefinition(recipes, userName, new Date());
  const fileName = `meine-rezepte-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).download(fileName);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
