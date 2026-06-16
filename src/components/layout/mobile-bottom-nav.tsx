"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Compass,
  ShoppingCart,
  User,
} from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import { shouldHideMobileChrome } from "@/lib/layout-utils";
import { cn } from "@/lib/utils";

const iconMap = {
  BookOpen,
  Compass,
  Calendar,
  ShoppingCart,
  User,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  if (shouldHideMobileChrome(pathname, search ? `?${search}` : "")) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Hauptnavigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active && "stroke-[2.5px]"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
