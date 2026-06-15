export async function shareOrCopy(options: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<"shared" | "copied"> {
  const shareText = [options.title, options.text, options.url]
    .filter(Boolean)
    .join("\n");

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") throw err;
    }
  }

  await navigator.clipboard.writeText(shareText);
  return "copied";
}

export function formatShoppingListText(
  title: string,
  items: { name: string; amount: number; unit: string; checked?: boolean }[]
): string {
  const lines = items
    .filter((i) => !i.checked)
    .map((i) => {
      const amount =
        i.amount % 1 === 0 ? i.amount.toString() : i.amount.toFixed(1);
      return `- ${i.name}${i.unit ? ` (${amount} ${i.unit})` : ""}`;
    });

  return `${title}\n\n${lines.join("\n")}`;
}
