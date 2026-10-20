"use client";

import { GameCard } from "@/components/home/game-card";
import { useGameDiscovery } from "@/components/home/game-discovery-context";
import { CategoryNav } from "@/components/shared/category-nav";
import { Button } from "@/components/ui/button";
import { GAME_CATEGORIES } from "@/constants/game-categories";

export function GameDiscoverySection() {
  const { filteredGames, setQuery } = useGameDiscovery();

  return (
    <section
      id="games"
      className="mx-auto max-w-6xl scroll-mt-20 px-6 pt-8 pb-16"
    >
      <h2 className="text-foreground text-2xl font-bold tracking-tight">
        Discover games
      </h2>
      <p className="text-muted-foreground mt-1 max-w-xl text-sm">
        A small, curated set of sample games while the catalogue takes shape.
      </p>

      <div id="categories" className="scroll-mt-20">
        <CategoryNav
          categories={GAME_CATEGORIES}
          active="all"
          className="mt-8"
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {filteredGames.length} games found
      </p>

      {filteredGames.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGames.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </ul>
      ) : (
        <div className="border-border-strong bg-surface mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="text-foreground font-medium">
            No games match your search.
          </p>
          <p className="text-muted-foreground text-sm">
            Try a different search term, or browse by category above.
          </p>
          <Button variant="secondary" onClick={() => setQuery("")}>
            Reset search
          </Button>
        </div>
      )}
    </section>
  );
}
