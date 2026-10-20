import { GameCard } from "@/components/home/game-card";
import type { Game } from "@/types/game";

export function RelatedGames({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return null;
  }

  return (
    <section className="mt-16" aria-labelledby="related-games-heading">
      <h2
        id="related-games-heading"
        className="text-foreground text-lg font-semibold"
      >
        You might also like
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </ul>
    </section>
  );
}
