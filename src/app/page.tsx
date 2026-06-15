import Link from "next/link";
import { redirect } from "next/navigation";
import { ChefHat, BookOpen, Calendar, Camera, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";

export default async function HomePage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/recipes");
  } catch {
    // Env fehlt – Landing Page trotzdem anzeigen
  }

  const features = [
    {
      icon: BookOpen,
      title: "Rezepte sammeln",
      description: "Speichere deine Lieblingsrezepte an einem Ort.",
    },
    {
      icon: Camera,
      title: "Foto digitalisieren",
      description: "Lade ein Foto hoch – KI extrahiert Zutaten und Schritte.",
    },
    {
      icon: Calendar,
      title: "Wochenplanung",
      description: "Plane deine Mahlzeiten und generiere Einkaufslisten.",
    },
    {
      icon: Heart,
      title: "Teilen & entdecken",
      description: "Teile Rezepte und übernimm spannende Ideen von anderen.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ChefHat className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-semibold">{APP_NAME}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Anmelden</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Registrieren</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="animate-fade-in text-4xl font-bold tracking-tight sm:text-6xl">
            Deine Rezepte.
            <br />
            <span className="text-primary">Schön organisiert.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            RezeptVault ist deine persönliche Rezeptsammlung – mit Foto-Digitalisierung,
            Wochenplanung, Einkaufslisten und optionalen Community-Funktionen.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">Kostenlos starten</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Anmelden</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/30 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="animate-slide-up rounded-2xl bg-card p-6 shadow-sm"
              >
                <feature.icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}
