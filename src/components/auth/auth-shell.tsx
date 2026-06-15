import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description?: string;
  showLogo?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({
  title,
  description,
  showLogo = false,
  children,
  className,
}: AuthShellProps) {
  return (
    <div className="auth-page flex min-h-dvh items-center justify-center">
      <div className={cn("auth-card w-full max-w-[420px] animate-fade-in", className)}>
        <div className="auth-card-header">
          {showLogo && (
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
