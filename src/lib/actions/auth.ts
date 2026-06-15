"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/recipes");
}

export async function registerAction(
  email: string,
  password: string,
  displayName: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
    },
  });

  if (error) {
    const message =
      error.message.includes("Database error") || error.status === 500
        ? "Registrierung fehlgeschlagen. Bitte später erneut versuchen."
        : error.message;
    return { error: message };
  }

  if (!data.session) {
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!loginError) {
      redirect("/recipes");
    }

    return {
      needsConfirmation: true,
      message:
        "Konto erstellt! Bitte bestätige deine E-Mail-Adresse und melde dich dann an.",
    };
  }

  redirect("/recipes");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
