"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Compass,
  Heart,
  LogOut,
  Plus,
  ShoppingCart,
  User,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  BookOpen,
  Compass,
  Heart,
  Calendar,
  ShoppingCart,
  User,
};

export function AppHeader() {
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await logoutAction();
    } catch {
      // redirect() wirft
    }
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-lg"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link href="/recipes" className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ChefHat className="h-5 w-5 text-primary" />
          </div>
          <span className="min-w-0 truncate text-lg font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop-Navigation */}
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

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild size="sm">
            <Link href="/recipes/new">
              <Plus className="mr-1 h-4 w-4" />
              Neues Rezept
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile: Favoriten-Shortcut + Abmelden */}
        <div className="flex items-center gap-1 md:hidden">
          <Link
            href="/favorites"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              pathname.startsWith("/favorites")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}
            aria-label="Favoriten"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground"
            aria-label="Abmelden"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
