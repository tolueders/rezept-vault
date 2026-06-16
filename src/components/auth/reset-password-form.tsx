"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const supabase = createClient();

    async function initSession() {
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setReady(true);
          setChecking(false);
          return;
        }
      }

      const hash = window.location.hash.substring(1);
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        if (hashParams.get("type") === "recovery") {
          setReady(true);
          setChecking(false);
          return;
        }
      }

      const isRecoveryFlow = searchParams.get("recovery") === "1";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && isRecoveryFlow) {
        setReady(true);
      }

      setChecking(false);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });

    initSession();
    return () => subscription.unsubscribe();
  }, [searchParams]);

  async function onSubmit(data: ResetPasswordFormValues) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast.error("Fehler", { description: error.message });
      setLoading(false);
      return;
    }

    toast.success("Passwort aktualisiert!");
    router.push("/login");
    router.refresh();
  }

  if (checking) {
    return (
      <AuthShell title="Wird geladen…" description="Link wird geprüft.">
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AuthShell>
    );
  }

  if (!ready) {
    return (
      <AuthShell
        title="Link ungültig oder abgelaufen"
        description="Bitte fordere einen neuen Link zum Zurücksetzen an."
      >
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/forgot-password">Neuen Link anfordern</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Neues Passwort"
      description="Wähle ein neues Passwort für dein Konto."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        <FormField
          label="Neues Passwort"
          htmlFor="password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        </FormField>

        <FormField
          label="Passwort bestätigen"
          htmlFor="confirm_password"
          error={errors.confirm_password?.message}
        >
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            {...register("confirm_password")}
          />
        </FormField>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Passwort speichern
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1 pt-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Zur Anmeldung
        </Link>
      </form>
    </AuthShell>
  );
}
