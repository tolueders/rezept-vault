"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Heart,
  LogOut,
  Menu,
  Plus,
  ShoppingCart,
  User,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const iconMap = {
  BookOpen,
  Heart,
  Calendar,
  ShoppingCart,
  User,
};

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Erfolgreich abgemeldet");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/recipes" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <ChefHat className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/recipes/new">
              <Plus className="mr-1 h-4 w-4" />
              Neues Rezept
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-secondary"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      {item.label}
                    </Link>
                  );
                })}
                <Link
                  href="/recipes/new"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-secondary"
                >
                  <Plus className="h-5 w-5 text-primary" />
                  Neues Rezept
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-secondary"
                >
                  <LogOut className="h-5 w-5" />
                  Abmelden
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
