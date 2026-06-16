"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToTopButtonProps {
  /** Ab welchem Scroll-Offset (px) der Button erscheint */
  threshold?: number;
}

export function ScrollToTopButton({ threshold }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function getThreshold() {
      return threshold ?? Math.max(window.innerHeight * 0.9, 320);
    }

    function onScroll() {
      setVisible(window.scrollY > getThreshold());
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [threshold]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Nach oben scrollen"
      className={cn(
        "fixed left-1/2 z-40 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-lg backdrop-blur-lg transition-all duration-300 active:scale-95 md:hidden",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
