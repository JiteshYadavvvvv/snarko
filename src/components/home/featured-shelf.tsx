import Link from "next/link";
import { GameArtwork } from "@/components/games/game-artwork";
import { AvailabilityIndicator } from "@/components/shared/availability-indicator";
import { Button } from "@/components/ui/button";
import { GAME_CATEGORY_META } from "@/constants/game-categories";
import { gameRoute } from "@/constants/routes";
import type { Game } from "@/types/game";

export function FeaturedShelf({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pt-4 pb-4">
      <h2 className="text-foreground text-2xl font-bold tracking-tight">
        Featured
      </h2>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2">
        {games.map((game) => {
          const { label, icon: CategoryIcon } =
            GAME_CATEGORY_META[game.category];
          return (
            <li
              key={game.slug}
              className="border-border bg-surface overflow-hidden rounded-lg border"
            >
              <Link href={gameRoute(game.slug)} className="group block">
                <GameArtwork
                  slug={game.slug}
                  category={game.category}
                  className="aspect-video transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </Link>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <CategoryIcon className="size-3.5" aria-hidden="true" />
                    {label}
                  </p>
                  <Link
                    href={gameRoute(game.slug)}
                    className="text-foreground mt-1 block text-xl font-bold tracking-tight hover:underline"
                  >
                    {game.title}
                  </Link>
                  <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
                    {game.description}
                  </p>
                  <AvailabilityIndicator
                    availability={game.availability}
                    className="mt-3"
                  />
                </div>
                <Button href={gameRoute(game.slug)} className="shrink-0">
                  Play now
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
