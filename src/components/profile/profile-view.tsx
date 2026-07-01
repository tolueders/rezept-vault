"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { Camera, Loader2, LogOut, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { profileSchema, type ProfileFormValues } from "@/lib/validations/auth";
import { updateProfile, uploadAvatar } from "@/lib/actions/profile";
import { CustomCategoriesSection } from "@/components/profile/custom-categories-section";
import { ChangePasswordSection } from "@/components/profile/change-password-section";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CustomCategory, Profile } from "@/types/database";

const RecipePdfExportButton = dynamic(
  () =>
    import("@/components/profile/recipe-pdf-export-button").then(
      (mod) => mod.RecipePdfExportButton
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-20 animate-pulse rounded-2xl border border-border/50 bg-card" />
    ),
  }
);

interface ProfileViewProps {
  profile: Profile;
  email: string;
  customCategories: CustomCategory[];
}

export function ProfileView({ profile, email, customCategories }: ProfileViewProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: profile.display_name },
  });

  const displayName = watch("display_name");
  const hasNameChange = displayName.trim() !== profile.display_name.trim();

  useEffect(() => {
    reset({ display_name: profile.display_name });
  }, [profile.display_name, reset]);

  async function onSubmit(data: ProfileFormValues) {
    try {
      await updateProfile(data.display_name);
      reset({ display_name: data.display_name });
      toast.success("Profil aktualisiert");
      router.refresh();
    } catch {
      toast.error("Fehler beim Speichern");
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await uploadAvatar(fd);
      toast.success("Profilbild aktualisiert");
      router.refresh();
    } catch {
      toast.error("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-2">
      <header className="page-header !mb-0">
        <h1 className="page-title">Profil</h1>
      </header>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 ring-2 ring-primary/10">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-medium">
                  {profile.display_name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleSubmit(onSubmit)}>
            <FormField
              label="Anzeigename"
              htmlFor="display_name"
              error={errors.display_name?.message}
            >
              <div className="relative">
                <Input
                  id="display_name"
                  className="pr-24"
                  {...register("display_name")}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  {hasNameChange ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="pointer-events-auto text-xs font-medium text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Speichern"
                      )}
                    </button>
                  ) : (
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            </FormField>
          </form>
        </CardContent>
      </Card>

      <CustomCategoriesSection categories={customCategories} />

      <RecipePdfExportButton userName={profile.display_name || "Rezeptsammler"} />

      <ChangePasswordSection email={email} />

      <Button variant="outline" size="lg" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Abmelden
      </Button>
    </div>
  );
}
