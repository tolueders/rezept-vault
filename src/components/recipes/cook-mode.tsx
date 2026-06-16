"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { scaleIngredients, formatAmount } from "@/lib/recipe-utils";
import type { RecipeIngredient, RecipeStep } from "@/types/database";
import { cn } from "@/lib/utils";

interface CookModeProps {
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  servings: number;
  title: string;
  onClose?: () => void;
}

export function CookMode({
  steps,
  ingredients,
  servings,
  title,
  onClose,
}: CookModeProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const sortedSteps = [...steps].sort((a, b) => a.sort_order - b.sort_order);
  const scaled = scaleIngredients(ingredients, servings, servings);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock not supported
      }
    }

    requestWakeLock();
    return () => {
      wakeLock?.release();
    };
  }, []);

  const scrollToStep = useCallback((index: number, smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    isScrolling.current = true;
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
    window.setTimeout(() => {
      isScrolling.current = false;
    }, smooth ? 350 : 50);
  }, []);

  useEffect(() => {
    scrollToStep(currentStep, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial layout only
  }, []);

  function handleScroll() {
    if (isScrolling.current) return;
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index >= 0 && index < sortedSteps.length && index !== currentStep) {
      setCurrentStep(index);
    }
  }

  function goToStep(index: number) {
    if (index < 0 || index >= sortedSteps.length) return;
    setCurrentStep(index);
    scrollToStep(index);
  }

  function handleClose() {
    if (onClose) onClose();
    else router.back();
  }

  function toggleIngredient(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (sortedSteps.length === 0) {
    if (!mounted) return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-6"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <p className="mb-4 text-center text-muted-foreground">
          Dieses Rezept hat noch keine Zubereitungsschritte.
        </p>
        <Button onClick={handleClose}>Zurück</Button>
      </div>,
      document.body
    );
  }

  const content = (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <header className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Schließen">
          <X className="h-5 w-5" />
        </Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            Schritt {currentStep + 1} von {sortedSteps.length}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setShowIngredients((s) => !s)}
        >
          Zutaten
        </Button>
      </header>

      {showIngredients && (
        <div className="max-h-40 shrink-0 overflow-y-auto border-b border-border px-4 py-3 sm:max-h-48">
          <ul className="space-y-2">
            {scaled.map((ing) => (
              <li key={ing.id} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={checked.has(ing.id)}
                  onCheckedChange={() => toggleIngredient(ing.id)}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    checked.has(ing.id) && "line-through opacity-50"
                  )}
                >
                  {ing.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatAmount(ing.amount, ing.unit)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Zubereitungsschritte"
      >
        {sortedSteps.map((step, index) => (
          <div
            key={step.id}
            className="flex h-full w-full shrink-0 snap-center snap-always flex-col items-center justify-center px-6 py-8 sm:px-10"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground sm:mb-8 sm:h-16 sm:w-16 sm:text-2xl">
              {index + 1}
            </div>
            <p className="cook-mode-text max-w-2xl text-center leading-relaxed">
              {step.instruction}
            </p>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex justify-center gap-1.5">
          {sortedSteps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToStep(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentStep
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              )}
              aria-label={`Schritt ${index + 1}`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground sm:hidden">
          Wische links oder rechts für den nächsten Schritt
        </p>
        <div className="flex gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="h-12 flex-1 text-base sm:h-14 sm:text-lg"
            disabled={currentStep === 0}
            onClick={() => goToStep(currentStep - 1)}
          >
            <ChevronLeft className="mr-1 h-5 w-5" />
            Zurück
          </Button>
          {currentStep >= sortedSteps.length - 1 ? (
            <Button
              className="h-12 flex-1 text-base sm:h-14 sm:text-lg"
              onClick={handleClose}
            >
              Fertig!
            </Button>
          ) : (
            <Button
              className="h-12 flex-1 text-base sm:h-14 sm:text-lg"
              onClick={() => goToStep(currentStep + 1)}
            >
              Weiter
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
