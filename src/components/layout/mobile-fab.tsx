"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const FAB_PATHS = ["/recipes", "/favorites", "/discover"];

export function MobileFab() {
  const pathname = usePathname();
  const show =
    FAB_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}?`)) &&
    !pathname.includes("/new");

  if (!show) return null;

  return (
    <Link
      href="/recipes/new"
      className={cn(
        "fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:hidden",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]"
      )}
      aria-label="Neues Rezept"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
