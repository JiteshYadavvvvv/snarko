import type { Game, GameCategory } from "@/types/game";

export const SAMPLE_GAMES: Game[] = [
  {
    slug: "neon-breaker",
    title: "Neon Breaker",
    category: "arcade",
    description:
      "Smash through glowing blocks in fast, one-more-try arcade bursts.",
    longDescription:
      "Neon Breaker drops you into a grid of glowing blocks with a paddle that never quite behaves. Chain breaks together, chase power-ups, and keep the run alive as the board speeds up around you.",
    availability: "coming-soon",
    featured: true,
    inputs: ["keyboard", "mouse", "touch"],
  },
  {
    slug: "tunnel-rush",
    title: "Tunnel Rush",
    category: "arcade",
    description:
      "Dodge, boost, and clip corners in an endless, ever-tightening tunnel run.",
    longDescription:
      "An endless tunnel run where the walls close in and the corners come faster than you'd like. Tunnel Rush is built for short, replayable sessions — one mistimed turn and you're starting over.",
    availability: "coming-soon",
    inputs: ["keyboard", "touch"],
  },
  {
    slug: "gridlock",
    title: "Gridlock",
    category: "puzzle",
    description:
      "Slide, rotate, and outsmart tightening grids before they lock you out.",
    longDescription:
      "Gridlock hands you a tightening grid and a shrinking list of safe moves. Slide and rotate pieces to keep a path open before the board locks you out entirely.",
    availability: "coming-soon",
    inputs: ["keyboard", "touch"],
  },
  {
    slug: "hexshift",
    title: "Hexshift",
    category: "puzzle",
    description: "Rotate hex tiles to route energy before the grid overloads.",
    longDescription:
      "A hex-tile routing puzzle: rotate tiles to connect energy from source to sink before the grid overloads. Hexshift rewards planning a few moves ahead rather than fast reflexes.",
    availability: "coming-soon",
    inputs: ["mouse", "touch"],
  },
  {
    slug: "scrap-circuit",
    title: "Scrap Circuit",
    category: "racing",
    description:
      "Scrappy go-karts, tight circuits, and a drift mechanic that rewards nerve.",
    longDescription:
      "Scrap Circuit puts scrappy, cobbled-together go-karts on tight, technical circuits. The drift mechanic is the whole game — carry it clean through one corner and the next one opens up.",
    availability: "coming-soon",
    featured: true,
    inputs: ["keyboard", "gamepad"],
  },
  {
    slug: "last-alley-standing",
    title: "Last Alley Standing",
    category: "action",
    description:
      "A side-scrolling brawl through back alleys, one tough crowd at a time.",
    longDescription:
      "A side-scrolling brawler fought through a string of back alleys, one tough crowd at a time. Last Alley Standing is about reading the crowd and picking fights you can actually win.",
    availability: "coming-soon",
    inputs: ["keyboard", "gamepad"],
  },
  {
    slug: "ink-and-iron",
    title: "Ink & Iron",
    category: "action",
    description:
      "Turn-based skirmishes fought across a hand-drawn, ink-splatter battlefield.",
    longDescription:
      "Turn-based skirmishes fought across a hand-drawn, ink-splatter battlefield. Ink & Iron trades real-time reflexes for positioning and timing.",
    availability: "coming-soon",
    inputs: ["mouse", "touch"],
  },
  {
    slug: "paper-stacker",
    title: "Paper Stacker",
    category: "casual",
    description:
      "Stack wobbling paper scraps as high as you dare before it topples.",
    longDescription:
      "A one-button balance game: stack wobbling scraps of paper as high as you can before the whole thing topples. Paper Stacker is built for a two-minute break, not a session.",
    availability: "coming-soon",
    inputs: ["mouse", "touch"],
  },
];

export function getSampleGameBySlug(slug: string): Game | undefined {
  return SAMPLE_GAMES.find((game) => game.slug === slug);
}

export function getRelatedSampleGames(current: Game, limit = 3): Game[] {
  const others = SAMPLE_GAMES.filter((game) => game.slug !== current.slug);
  const sameCategory = others.filter(
    (game) => game.category === current.category,
  );
  const rest = others.filter((game) => game.category !== current.category);
  return [...sameCategory, ...rest].slice(0, limit);
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
