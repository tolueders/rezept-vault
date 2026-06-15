"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { APP_NAME } from "@/lib/constants";
import { toast } from "sonner";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setLoading(true);
    try {
      const result = await loginAction(data.email, data.password);
      if (result?.error) {
        toast.error("Anmeldung fehlgeschlagen", { description: result.error });
        setLoading(false);
      }
    } catch {
      // redirect() wirft – Erfolg
    }
  }

  return (
    <AuthShell
      title={APP_NAME}
      description="Melde dich an, um deine Rezepte zu verwalten"
      showLogo
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        <FormField label="E-Mail" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="deine@email.de"
            autoComplete="email"
            {...register("email")}
          />
        </FormField>

        <FormField label="Passwort" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </FormField>

        <Link
          href="/forgot-password"
          className="-mt-1 text-sm font-medium text-primary hover:underline"
        >
          Passwort vergessen?
        </Link>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Anmelden
        </Button>

        <p className="pt-1 text-center text-sm text-muted-foreground">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Registrieren
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
