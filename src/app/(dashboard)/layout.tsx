import { AppHeader } from "@/components/layout/app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileFab } from "@/components/layout/mobile-fab";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/lib/supabase/auth-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="app-main mx-auto max-w-7xl overflow-x-hidden px-4 py-4 sm:px-6 sm:py-8">
        {children}
      </main>
      <MobileFab />
      <MobileBottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
