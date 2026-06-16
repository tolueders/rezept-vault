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

function dividerLine(margin: [number, number, number, number] = [0, 0, 0, 12]): Content {
  return {
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
    margin,
  };
}

function categoryBadge(category: string): Content {
  return {
    table: {
      widths: ["auto"],
      body: [
        [
          {
            text: category,
            color: COLORS.green,
            fillColor: COLORS.beige,
            bold: true,
            fontSize: 8,
            margin: [8, 4, 8, 4],
            border: [false, false, false, false],
          },
        ],
      ],
    },
    layout: "noBorders",
  };
}

function buildRecipePage(recipe: PdfExportRecipe): Content[] {
  const blocks: Content[] = [
    categoryBadge(getCategoryName(recipe)),
    {
      text: recipe.title,
      style: "recipeTitle",
      margin: [0, 10, 0, 6],
    },
  ];

  const rating = getAverageRating(recipe);
  if (rating > 0) {
    blocks.push({
      text: `Bewertung: ${Math.round(rating)} / 5`,
      style: "metaLine",
      margin: [0, 0, 0, 8],
    });
  }

  if (recipe.description?.trim()) {
    blocks.push({
      text: recipe.description.trim(),
      style: "recipeDescription",
      margin: [0, 0, 0, 10],
    });
  }

  blocks.push({
    text: `Kochzeit: ${recipe.cook_time_minutes} Min.   |   Portionen: ${recipe.servings}   |   ${DIFFICULTY_LABELS[recipe.difficulty]}`,
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

  blocks.push(dividerLine());

  blocks.push({
    columns: [
      {
        width: "*",
        stack: [
          { text: "ZUTATEN", style: "sectionHeading" },
          {
            ul: recipe.ingredients.map(
              (ing) => `${formatAmount(ing.amount, ing.unit)} ${ing.name}`
            ),
            style: "bodyText",
            margin: [0, 6, 0, 0],
          },
        ],
      },
      { width: 24, text: "" },
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
    blocks.push(dividerLine([0, 16, 0, 8]));
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

function buildTocPage(grouped: Map<string, PdfExportRecipe[]>): Content {
  const lines: Content[] = [
    { text: "Inhaltsverzeichnis", style: "tocTitle", margin: [0, 0, 0, 20] },
  ];

  for (const [category, categoryRecipes] of grouped) {
    lines.push({
      text: category,
      style: "tocCategory",
      margin: [0, 10, 0, 4],
    });
    for (const recipe of categoryRecipes) {
      lines.push({
        text: recipe.title,
        style: "tocEntry",
        margin: [16, 2, 0, 0],
      });
    }
  }

  return { stack: lines, pageBreak: "after" };
}

export function buildRecipesPdfDefinition(
  recipes: PdfExportRecipe[],
  userName: string,
  exportDate: Date
): TDocumentDefinitions {
  const grouped = groupByCategory(recipes);
  const dateLabel = formatExportDate(exportDate);

  const content: Content[] = [
    {
      stack: [
        {
          canvas: [
            { type: "rect", x: 0, y: 0, w: CONTENT_WIDTH, h: 6, color: COLORS.green },
          ],
        },
        { text: "Meine Rezeptsammlung", style: "coverTitle", margin: [0, 72, 0, 12] },
        { text: userName, style: "coverSubtitle", margin: [0, 0, 0, 4] },
        { text: dateLabel, style: "coverDate", margin: [0, 0, 0, 16] },
        { text: `${recipes.length} Rezepte`, style: "coverCount", margin: [0, 0, 0, 24] },
        {
          canvas: [
            {
              type: "line",
              x1: 140,
              y1: 0,
              x2: 375,
              y2: 0,
              lineWidth: 2,
              lineColor: COLORS.green,
            },
          ],
        },
      ],
      pageBreak: "after",
    },
    buildTocPage(grouped),
  ];

  for (const [, categoryRecipes] of grouped) {
    for (const recipe of categoryRecipes) {
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
      coverTitle: { fontSize: 26, bold: true, alignment: "center", color: COLORS.brown },
      coverSubtitle: { fontSize: 14, alignment: "center", color: COLORS.green },
      coverDate: { fontSize: 11, alignment: "center", color: COLORS.brown },
      coverCount: { fontSize: 12, alignment: "center", color: COLORS.brown },
      tocTitle: { fontSize: 20, bold: true, color: COLORS.brown },
      tocCategory: { fontSize: 12, bold: true, color: COLORS.green },
      tocEntry: { fontSize: 10, color: COLORS.brown },
      recipeTitle: { fontSize: 18, bold: true, color: COLORS.brown },
      recipeDescription: { fontSize: 10, italics: true },
      metaLine: { fontSize: 9, color: COLORS.green },
      tags: { fontSize: 9, color: COLORS.green },
      sectionHeading: { fontSize: 11, bold: true, color: COLORS.brown },
      bodyText: { fontSize: 10, lineHeight: 1.35 },
    },
    footer(currentPage, pageCount) {
      return {
        columns: [
          { text: `Erstellt mit ${APP_NAME} · ${dateLabel}`, fontSize: 8, color: COLORS.green },
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
