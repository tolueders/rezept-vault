import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
      <h2 className="mb-2 text-xl font-semibold">Seite nicht gefunden</h2>
      <p className="mb-8 text-muted-foreground">
        Diese Seite existiert nicht oder wurde verschoben.
      </p>
      <Button asChild>
        <Link href="/recipes">Zur Startseite</Link>
      </Button>
    </div>
  );
}
