import type { Game, GameCategory } from "@/types/game";

export const SAMPLE_GAMES: Game[] = [
  {
    slug: "neon-breaker",
    title: "Neon Breaker",
    category: "arcade",
    description:
      "Smash through glowing blocks in fast, one-more-try arcade bursts.",
    featured: true,
    inputs: ["keyboard", "mouse", "touch"],
  },
  {
    slug: "tunnel-rush",
    title: "Tunnel Rush",
    category: "arcade",
    description:
      "Dodge, boost, and clip corners in an endless, ever-tightening tunnel run.",
    inputs: ["keyboard", "touch"],
  },
  {
    slug: "gridlock",
    title: "Gridlock",
    category: "puzzle",
    description:
      "Slide, rotate, and outsmart tightening grids before they lock you out.",
    inputs: ["keyboard", "touch"],
  },
  {
    slug: "hexshift",
    title: "Hexshift",
    category: "puzzle",
    description: "Rotate hex tiles to route energy before the grid overloads.",
    inputs: ["mouse", "touch"],
  },
  {
    slug: "scrap-circuit",
    title: "Scrap Circuit",
    category: "racing",
    description:
      "Scrappy go-karts, tight circuits, and a drift mechanic that rewards nerve.",
    featured: true,
    inputs: ["keyboard", "gamepad"],
  },
  {
    slug: "last-alley-standing",
    title: "Last Alley Standing",
    category: "action",
    description:
      "A side-scrolling brawl through back alleys, one tough crowd at a time.",
    inputs: ["keyboard", "gamepad"],
  },
  {
    slug: "ink-and-iron",
    title: "Ink & Iron",
    category: "action",
    description:
      "Turn-based skirmishes fought across a hand-drawn, ink-splatter battlefield.",
    inputs: ["mouse", "touch"],
  },
  {
    slug: "paper-stacker",
    title: "Paper Stacker",
    category: "casual",
    description:
      "Stack wobbling paper scraps as high as you dare before it topples.",
    inputs: ["mouse", "touch"],
  },
];

export function getSampleGameCategories(): GameCategory[] {
  return Array.from(new Set(SAMPLE_GAMES.map((game) => game.category)));
}

interface FilterGamesOptions {
  query?: string;
  category?: GameCategory | "all";
}

export function filterSampleGames(
  games: Game[],
  { query = "", category = "all" }: FilterGamesOptions,
): Game[] {
  const normalizedQuery = query.trim().toLowerCase();

  return games.filter((game) => {
    const matchesCategory = category === "all" || game.category === category;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      game.title.toLowerCase().includes(normalizedQuery) ||
      game.category.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
