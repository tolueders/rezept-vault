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
import { registerAction } from "@/lib/actions/auth";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { toast } from "sonner";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormValues) {
    setLoading(true);
    try {
      const result = await registerAction(
        data.email,
        data.password,
        data.display_name
      );
      if (result?.error) {
        toast.error("Registrierung fehlgeschlagen", { description: result.error });
        setLoading(false);
        return;
      }
      if (result?.needsConfirmation) {
        toast.success("Fast geschafft!", { description: result.message });
        setLoading(false);
        return;
      }
    } catch {
      // redirect() wirft – Erfolg
    }
  }

  return (
    <AuthShell
      title="Konto erstellen"
      description="Starte deine persönliche Rezeptsammlung"
      showLogo
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        <FormField
          label="Anzeigename"
          htmlFor="display_name"
          error={errors.display_name?.message}
        >
          <Input id="display_name" placeholder="Maria" {...register("display_name")} />
        </FormField>

        <FormField label="E-Mail" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </FormField>

        <FormField label="Passwort" htmlFor="password" error={errors.password?.message}>
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
          Registrieren
        </Button>

        <p className="pt-1 text-center text-sm text-muted-foreground">
          Bereits registriert?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Anmelden
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
