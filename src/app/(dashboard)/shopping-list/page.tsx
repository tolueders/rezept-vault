import { createClient } from "@/lib/supabase/server";
import { ShoppingListView } from "@/components/shopping/shopping-list-view";

export const metadata = { title: "Einkaufsliste" };

export default async function ShoppingListPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("*, items:shopping_list_items(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <ShoppingListView
      lists={lists || []}
      activeListId={params.id}
    />
  );
}
