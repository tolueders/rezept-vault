import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import type { PdfExportRecipe } from "@/types/pdf-export";
import { APP_NAME, DIFFICULTY_LABELS } from "@/lib/constants";
import { formatAmount } from "@/lib/recipe-utils";

const COLORS = {
  green: "#6B8F5E",
  brown: "#2C1A0E",
  beige: "#E8DDD0",
  white: "#FFFFFF",
};

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

function formatStars(rating: number): string {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
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

function buildRecipePage(recipe: PdfExportRecipe): Content[] {
  const category = getCategoryName(recipe);
  const rating = getAverageRating(recipe);
  const blocks: Content[] = [
    {
      text: `  ${category}  `,
      style: "categoryBadge",
      margin: [0, 0, 0, 12],
    },
    {
      columns: [
        { text: recipe.title, style: "recipeTitle", width: "*" },
        { text: formatStars(rating), style: "stars", width: "auto", alignment: "right" },
      ],
      margin: [0, 0, 0, 6],
    },
  ];

  if (recipe.description?.trim()) {
    blocks.push({
      text: recipe.description.trim(),
      style: "recipeDescription",
      margin: [0, 0, 0, 12],
    });
  }

  blocks.push({
    text: [
      `⏱ ${recipe.cook_time_minutes} Min Kochzeit   `,
      `👥 ${recipe.servings} Portionen   `,
      `📊 ${DIFFICULTY_LABELS[recipe.difficulty]}`,
    ],
    style: "metaLine",
    margin: [0, 0, 0, 10],
  });

  if (recipe.tags.length > 0) {
    blocks.push({
      text: recipe.tags.map((t) => t.tag).join("  •  "),
      style: "tags",
      margin: [0, 0, 0, 14],
    });
  }

  blocks.push({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLORS.beige }],
    margin: [0, 0, 0, 14],
  });

  const ingredientLines = recipe.ingredients.map(
    (ing) => `• ${formatAmount(ing.amount, ing.unit)} ${ing.name}`
  );
  const stepLines = recipe.steps.map(
    (step, index) => `${index + 1}. ${step.instruction}`
  );

  blocks.push({
    columns: [
      {
        width: "48%",
        stack: [
          { text: "ZUTATEN", style: "sectionHeading" },
          { text: ingredientLines.join("\n"), style: "bodyText", margin: [0, 8, 0, 0] },
        ],
      },
      {
        width: "4%",
        text: "",
      },
      {
        width: "48%",
        stack: [
          { text: "ZUBEREITUNG", style: "sectionHeading" },
          { text: stepLines.join("\n\n"), style: "bodyText", margin: [0, 8, 0, 0] },
        ],
      },
    ],
    columnGap: 10,
  });

  if (recipe.comments.length > 0) {
    blocks.push({
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: COLORS.beige }],
      margin: [0, 18, 0, 10],
    });
    blocks.push({ text: "KOMMENTARE", style: "sectionHeading", margin: [0, 0, 0, 8] });
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
    { text: "Meine Rezeptsammlung", style: "coverTitle", margin: [0, 120, 0, 16] },
    { text: `${userName} • ${dateLabel}`, style: "coverSubtitle", margin: [0, 0, 0, 24] },
    { text: `${recipes.length} Rezepte`, style: "coverCount", margin: [0, 0, 0, 32] },
    {
      canvas: [{ type: "line", x1: 180, y1: 0, x2: 335, y2: 0, lineWidth: 2, lineColor: COLORS.green }],
    },
    { text: "", pageBreak: "after" },
    { text: "Inhaltsverzeichnis", style: "tocTitle", margin: [0, 0, 0, 20] },
    { toc: { title: { text: "", style: "tocTitle" } }, pageBreak: "after" },
  ];

  for (const [category, categoryRecipes] of grouped) {
    content.push({
      text: category,
      tocItem: true,
      tocStyle: { fontSize: 12, bold: true, color: COLORS.brown },
      tocMargin: [0, 6, 0, 2],
    });

    for (const recipe of categoryRecipes) {
      content.push({
        text: recipe.title,
        tocItem: true,
        tocStyle: { fontSize: 10, color: COLORS.brown },
        tocMargin: [16, 2, 0, 2],
        pageBreak: "before",
        stack: buildRecipePage(recipe),
      } as unknown as Content);
    }
  }

  return {
    pageSize: "A4",
    pageMargins: [40, 50, 40, 60],
    defaultStyle: { font: "Roboto", color: COLORS.brown },
    styles: {
      coverTitle: { fontSize: 28, bold: true, alignment: "center", color: COLORS.brown },
      coverSubtitle: { fontSize: 14, alignment: "center", color: COLORS.green },
      coverCount: { fontSize: 12, alignment: "center", color: COLORS.brown },
      tocTitle: { fontSize: 20, bold: true, color: COLORS.brown },
      tocCategory: { fontSize: 14, bold: true, color: COLORS.green, margin: [0, 0, 0, 8] },
      categoryBadge: {
        fontSize: 9,
        color: COLORS.green,
        background: COLORS.beige,
      },
      recipeTitle: { fontSize: 18, bold: true, color: COLORS.brown },
      stars: { fontSize: 12, color: COLORS.green },
      recipeDescription: { fontSize: 10, italics: true, color: COLORS.brown },
      metaLine: { fontSize: 9, color: COLORS.green },
      tags: { fontSize: 9, color: COLORS.green },
      sectionHeading: { fontSize: 11, bold: true, color: COLORS.brown },
      bodyText: { fontSize: 10, lineHeight: 1.35, color: COLORS.brown },
    },
    footer(currentPage, pageCount) {
      return {
        columns: [
          {
            text: `Erstellt mit ${APP_NAME} App • ${dateLabel}`,
            fontSize: 8,
            color: COLORS.green,
            alignment: "left",
          },
          {
            text: `${currentPage} / ${pageCount}`,
            fontSize: 8,
            color: COLORS.green,
            alignment: "right",
          },
        ],
        margin: [40, 0, 40, 20],
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
