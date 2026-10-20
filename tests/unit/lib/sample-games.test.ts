import { describe, expect, it } from "vitest";
import {
  SAMPLE_GAMES,
  filterSampleGames,
  getRelatedSampleGames,
  getSampleGameBySlug,
} from "@/lib/sample-games";
import type { Game } from "@/types/game";

const games: Game[] = [
  {
    slug: "neon-breaker",
    title: "Neon Breaker",
    category: "arcade",
    description: "Smash through glowing blocks.",
    availability: "coming-soon",
  },
  {
    slug: "gridlock",
    title: "Gridlock",
    category: "puzzle",
    description: "Slide and rotate tightening grids.",
    availability: "coming-soon",
  },
  {
    slug: "scrap-circuit",
    title: "Scrap Circuit",
    category: "racing",
    description: "Scrappy go-karts and tight circuits.",
    availability: "coming-soon",
  },
];

describe("filterSampleGames", () => {
  it("returns every game when no filters are applied", () => {
    expect(filterSampleGames(games, {})).toHaveLength(3);
  });

  it("filters by category", () => {
    const result = filterSampleGames(games, { category: "puzzle" });
    expect(result.map((game) => game.slug)).toEqual(["gridlock"]);
  });

  it("filters by case-insensitive title match", () => {
    const result = filterSampleGames(games, { query: "neon" });
    expect(result.map((game) => game.slug)).toEqual(["neon-breaker"]);
  });

  it("filters by category name as free text", () => {
    const result = filterSampleGames(games, { query: "racing" });
    expect(result.map((game) => game.slug)).toEqual(["scrap-circuit"]);
  });

  it("combines category and query filters", () => {
    const result = filterSampleGames(games, {
      category: "arcade",
      query: "grid",
    });
    expect(result).toHaveLength(0);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterSampleGames(games, { query: "zzz-no-match" })).toHaveLength(0);
  });
});

describe("getSampleGameBySlug", () => {
  it("returns the matching catalogue entry for a real slug", () => {
    const game = getSampleGameBySlug("neon-breaker");
    expect(game?.title).toBe("Neon Breaker");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getSampleGameBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getRelatedSampleGames", () => {
  it("excludes the current game from its own related list", () => {
    const current = SAMPLE_GAMES[0];
    const related = getRelatedSampleGames(current);
    expect(related.some((game) => game.slug === current.slug)).toBe(false);
  });

  it("prefers games in the same category", () => {
    const current = SAMPLE_GAMES.find((game) => game.slug === "neon-breaker")!;
    const related = getRelatedSampleGames(current, 1);
    expect(related).toHaveLength(1);
    expect(related[0].category).toBe(current.category);
  });

  it("falls back to other categories when the current category runs out", () => {
    const current = SAMPLE_GAMES.find((game) => game.slug === "paper-stacker")!;
    const related = getRelatedSampleGames(current, 3);
    expect(related.every((game) => game.slug !== current.slug)).toBe(true);
    expect(related.length).toBeGreaterThan(0);
  });

  it("never returns more than the requested limit", () => {
    const current = SAMPLE_GAMES[0];
    expect(getRelatedSampleGames(current, 2)).toHaveLength(2);
  });
});
