"use client";

import { Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeVisibilityToggleProps {
  value: boolean;
  onChange: (isPublic: boolean) => void;
  publicDisabled?: boolean;
  publicDisabledHint?: string;
}

export function RecipeVisibilityToggle({
  value,
  onChange,
  publicDisabled = false,
  publicDisabledHint,
}: RecipeVisibilityToggleProps) {
  return (
    <div className="flex w-full flex-col gap-1.5 sm:max-w-xs">
      <div className="flex rounded-xl border border-border/50 bg-secondary/30 p-1">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            !value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Lock className="h-4 w-4" />
          Privat
        </button>
        <button
          type="button"
          onClick={() => !publicDisabled && onChange(true)}
          disabled={publicDisabled}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            publicDisabled && "cursor-not-allowed opacity-50 hover:text-muted-foreground"
          )}
        >
          <Globe className="h-4 w-4" />
          Öffentlich
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {publicDisabled && publicDisabledHint
          ? publicDisabledHint
          : value
            ? "Erscheint unter Entdecken und kann geteilt werden."
            : "Nur für dich sichtbar."}
      </p>
    </div>
  );
}
