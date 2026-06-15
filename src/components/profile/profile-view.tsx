"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileSchema, type ProfileFormValues } from "@/lib/validations/auth";
import { updateProfile, uploadAvatar } from "@/lib/actions/profile";
import { CustomCategoriesSection } from "@/components/profile/custom-categories-section";
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
      <h1 className="text-2xl font-bold sm:text-3xl">Profil</h1>

      <Card className="border-border/60">
        <CardHeader className="items-center text-center">
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
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Anzeigename</Label>
              <Input id="display_name" {...register("display_name")} />
              {errors.display_name && (
                <p className="text-sm text-destructive">
                  {errors.display_name.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      <CustomCategoriesSection categories={customCategories} />

      <Button variant="outline" className="w-full" onClick={handleLogout}>
        Abmelden
      </Button>
    </div>
  );
}
