"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChangePasswordSectionProps {
  email: string;
}

export function ChangePasswordSection({ email }: ChangePasswordSectionProps) {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    toast.success("Passwort geändert");
    setLoading(false);
  }

  return (
    <Card size="sm" className="border-border/50 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary/30"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-medium">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          Passwort ändern
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-2.5 border-t border-border/50 px-4 pb-4 pt-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
              <FormField
                label="Aktuelles Passwort"
                htmlFor="current_password"
                error={errors.current_password?.message}
              >
                <Input
                  id="current_password"
                  type="password"
                  autoComplete="current-password"
                  className="h-9"
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
                  className="h-9"
                  {...register("password")}
                />
              </FormField>
              <FormField
                label="Bestätigen"
                htmlFor="confirm_password"
                error={errors.confirm_password?.message}
              >
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  className="h-9"
                  {...register("confirm_password")}
                />
              </FormField>
              <Button type="submit" variant="ghost" size="sm" disabled={loading} className="h-8 px-2">
                {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Passwort speichern
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Card>
  );
}
