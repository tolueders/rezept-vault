"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <h2 className="mb-2 text-xl font-semibold">Etwas ist schiefgelaufen</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        Bitte versuche es erneut. Falls das Problem bestehen bleibt, melde dich
        kurz ab und wieder an.
      </p>
      <Button onClick={reset}>Erneut versuchen</Button>
    </div>
  );
}
