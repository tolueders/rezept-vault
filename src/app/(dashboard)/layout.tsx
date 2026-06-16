import { Suspense } from "react";
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
      <main className="app-main mx-auto max-w-7xl min-w-0 overflow-x-hidden px-4 pb-5 pt-4 sm:px-6 md:pb-8 md:pt-6">
        {children}
      </main>
      <Suspense fallback={null}>
        <MobileFab />
        <MobileBottomNav />
      </Suspense>
      <Toaster position="top-center" richColors />
    </div>
  );
}
