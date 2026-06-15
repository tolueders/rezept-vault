import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "@/components/profile/profile-view";
import { redirect } from "next/navigation";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <ProfileView
      profile={profile || { id: user.id, display_name: "", avatar_url: null, created_at: "", updated_at: "" }}
      email={user.email || ""}
    />
  );
}
