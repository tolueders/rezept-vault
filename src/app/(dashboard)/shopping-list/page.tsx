import { ShoppingListView } from "@/components/shopping/shopping-list-view";
import { getShoppingListPageData } from "@/lib/queries/shopping-lists";
import { redirect } from "next/navigation";

export const metadata = { title: "Einkaufsliste" };

export default async function ShoppingListPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const data = await getShoppingListPageData();

  if (!data) redirect("/login");

  return (
    <ShoppingListView
      planList={data.planList}
      extrasList={data.extrasList}
      planEntries={data.planEntries}
      planWeekStarts={data.planWeekStarts}
      shopMode={params.mode === "shop"}
    />
  );
}
