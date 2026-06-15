"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecipeStep } from "@/types/database";

interface CookModeProps {
  steps: RecipeStep[];
  title: string;
}

export function CookMode({ steps, title }: CookModeProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const sortedSteps = [...steps].sort((a, b) => a.sort_order - b.sort_order);

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

  const step = sortedSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <div className="text-center flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-sm font-medium">
            Schritt {currentStep + 1} von {sortedSteps.length}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {currentStep + 1}
        </div>
        <p className="cook-mode-text max-w-2xl text-center">{step?.instruction}</p>
      </div>

      <div className="flex gap-4 border-t border-border p-4">
        <Button
          variant="outline"
          className="flex-1 h-14 text-lg"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => s - 1)}
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Zurück
        </Button>
        <Button
          className="flex-1 h-14 text-lg"
          disabled={currentStep >= sortedSteps.length - 1}
          onClick={() => setCurrentStep((s) => s + 1)}
        >
          Weiter
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
