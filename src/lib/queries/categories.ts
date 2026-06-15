import { createClient } from "@/lib/supabase/server";

export async function getCustomCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("custom_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) return [];
  return data || [];
}
