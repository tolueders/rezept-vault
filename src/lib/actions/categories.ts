"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/recipe-utils";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");
  return { supabase, user };
}

export async function getCustomCategories() {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("custom_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createCustomCategory(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error("Name muss mindestens 2 Zeichen haben");

  const { supabase, user } = await requireUser();
  const slug = generateSlug(trimmed);

  const { data, error } = await supabase
    .from("custom_categories")
    .insert({ user_id: user.id, name: trimmed, slug })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Kategorie existiert bereits");
    throw new Error(error.message);
  }

  revalidatePath("/profile");
  revalidatePath("/recipes");
  return data;
}

export async function deleteCustomCategory(id: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("custom_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/recipes");
}
