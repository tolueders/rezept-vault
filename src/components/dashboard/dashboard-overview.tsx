import Link from "next/link";
import { BookOpen, Calendar, Compass, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardOverviewProps {
  stats: {
    displayName: string;
    recipeCount: number;
    favoriteCount: number;
    publicCount: number;
    plannedMeals: number;
  };
}

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  const cards = [
    { label: "Rezepte", value: stats.recipeCount, icon: BookOpen, href: "/recipes" },
    { label: "Favoriten", value: stats.favoriteCount, icon: Heart, href: "/favorites" },
    { label: "Öffentlich", value: stats.publicCount, icon: Compass, href: "/discover" },
    { label: "Diese Woche", value: stats.plannedMeals, icon: Calendar, href: "/meal-plan" },
  ];

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Hallo, {stats.displayName}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Was möchtest du heute kochen?
          </p>
        </div>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="mr-1 h-4 w-4" />
            Neues Rezept
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="border-border/60 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
