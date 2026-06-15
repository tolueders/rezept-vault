import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    return user;
  } catch {
    redirect("/login");
  }
}

export async function redirectIfAuthenticated() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/recipes");
  } catch {
    // Env nicht konfiguriert – Login-Seite anzeigen
  }
}
