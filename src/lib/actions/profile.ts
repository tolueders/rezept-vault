"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { STORAGE_BUCKETS } from "@/lib/constants";

export async function uploadRecipeImage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const file = formData.get("file") as File;
  if (!file) throw new Error("Keine Datei");

  const ext = file.name.split(".").pop() || "webp";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.recipeImages)
    .upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKETS.recipeImages).getPublicUrl(path);

  return publicUrl;
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const file = formData.get("file") as File;
  if (!file) throw new Error("Keine Datei");

  const path = `${user.id}/avatar.webp`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.avatars)
    .upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKETS.avatars).getPublicUrl(path);

  await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  revalidatePath("/profile");
  return publicUrl;
}

export async function updateProfile(displayName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht autorisiert");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}
