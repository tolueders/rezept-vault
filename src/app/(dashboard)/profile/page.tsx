import { createClient } from "@/lib/supabase/server";
import { getUserCategories } from "@/lib/queries/categories";
import { ProfileView } from "@/components/profile/profile-view";
import { redirect } from "next/navigation";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, userCategories] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getUserCategories(),
  ]);

  return (
    <ProfileView
      profile={profile || { id: user.id, display_name: "", avatar_url: null, created_at: "", updated_at: "" }}
      email={user.email || ""}
      userCategories={userCategories}
    />
  );
}
