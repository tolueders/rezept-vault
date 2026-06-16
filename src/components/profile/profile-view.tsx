"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileSchema, type ProfileFormValues } from "@/lib/validations/auth";
import { updateProfile, uploadAvatar } from "@/lib/actions/profile";
import dynamic from "next/dynamic";
import { CustomCategoriesSection } from "@/components/profile/custom-categories-section";
import { ChangePasswordSection } from "@/components/profile/change-password-section";

const RecipePdfExportButton = dynamic(
  () =>
    import("@/components/profile/recipe-pdf-export-button").then(
      (mod) => mod.RecipePdfExportButton
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 animate-pulse rounded-2xl border border-border/50 bg-card" />
    ),
  }
);
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CustomCategory, Profile } from "@/types/database";

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
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: profile.display_name },
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      await updateProfile(data.display_name);
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
    <div className="mx-auto max-w-lg space-y-6">
      <header className="page-header">
        <h1 className="page-title">Profil</h1>
        <p className="page-subtitle">Verwalte dein Konto und deine Kategorien</p>
      </header>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="items-center gap-4 pb-2 text-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.display_name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
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
          <CardTitle>{profile.display_name}</CardTitle>
          <p className="text-sm text-muted-foreground">{email}</p>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
            <FormField
              label="Anzeigename"
              htmlFor="display_name"
              error={errors.display_name?.message}
            >
              <Input id="display_name" {...register("display_name")} />
            </FormField>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      <ChangePasswordSection email={email} />

      <RecipePdfExportButton userName={profile.display_name || "Rezeptsammler"} />

      <CustomCategoriesSection categories={customCategories} />

      <Button variant="outline" size="lg" className="w-full" onClick={handleLogout}>
        Abmelden
      </Button>
    </div>
  );
}
