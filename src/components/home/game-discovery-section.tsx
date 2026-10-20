"use client";

import type { LucideIcon } from "lucide-react";
import { GameCard } from "@/components/home/game-card";
import { useGameDiscovery } from "@/components/home/game-discovery-context";
import { Button } from "@/components/ui/button";
import { GAME_CATEGORY_META } from "@/constants/game-categories";
import type { GameCategory } from "@/types/game";

function CategoryPill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon?: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
        active
          ? "bg-brand-red text-brand-red-foreground border-brand-red"
          : "border-border text-foreground hover:bg-surface"
      }`}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {label}
    </button>
  );
}

export function GameDiscoverySection() {
  const { category, setCategory, categories, filteredGames, setQuery } =
    useGameDiscovery();

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

      <div id="categories" className="mt-8 flex scroll-mt-20 flex-wrap gap-2">
        <CategoryPill
          label="All"
          active={category === "all"}
          onClick={() => setCategory("all")}
        />
        {categories.map((cat: GameCategory) => {
          const meta = GAME_CATEGORY_META[cat];
          return (
            <CategoryPill
              key={cat}
              label={meta.label}
              icon={meta.icon}
              active={category === cat}
              onClick={() => setCategory(cat)}
            />
          );
        })}
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
        <div className="border-border mt-8 flex flex-col items-center gap-3 rounded-md border py-16 text-center">
          <p className="text-foreground font-medium">
            No games match your search.
          </p>
          <p className="text-muted-foreground text-sm">
            Try a different category or clear your search.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Reset filters
          </Button>
        </div>
      )}
    </section>
  );
}
