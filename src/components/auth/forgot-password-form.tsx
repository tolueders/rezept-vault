"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type LoginFormValues,
} from "@/lib/validations/auth";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Pick<LoginFormValues, "email">>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: Pick<LoginFormValues, "email">) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error("Fehler", { description: error.message });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
    toast.success("E-Mail gesendet");
  }

  if (sent) {
    return (
      <AuthShell
        title="E-Mail gesendet"
        description="Prüfe dein Postfach für den Link zum Zurücksetzen des Passworts."
      >
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Anmeldung
          </Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Passwort vergessen"
      description="Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        <FormField label="E-Mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </FormField>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Link senden
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1 pt-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Anmeldung
        </Link>
      </form>
    </AuthShell>
  );
}
