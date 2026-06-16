"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/lib/validations/auth";
import { toast } from "sonner";

interface ChangePasswordSectionProps {
  email: string;
}

export function ChangePasswordSection({ email }: ChangePasswordSectionProps) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordFormValues) {
    setLoading(true);
    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: data.current_password,
    });

    if (verifyError) {
      toast.error("Aktuelles Passwort ist falsch");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      toast.error("Fehler", { description: error.message });
      setLoading(false);
      return;
    }

    reset();
    toast.success("Passwort geändert");
    setLoading(false);
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-primary" />
          Passwort ändern
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
          <FormField
            label="Aktuelles Passwort"
            htmlFor="current_password"
            error={errors.current_password?.message}
          >
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              {...register("current_password")}
            />
          </FormField>
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
            label="Neues Passwort bestätigen"
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
          <Button type="submit" variant="outline" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Passwort speichern
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
