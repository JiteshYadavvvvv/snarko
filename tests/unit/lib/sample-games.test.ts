import { describe, expect, it } from "vitest";
import { filterSampleGames, getSampleGameCategories } from "@/lib/sample-games";
import type { Game } from "@/types/game";

const games: Game[] = [
  {
    slug: "neon-breaker",
    title: "Neon Breaker",
    category: "arcade",
    description: "Smash through glowing blocks.",
  },
  {
    slug: "gridlock",
    title: "Gridlock",
    category: "puzzle",
    description: "Slide and rotate tightening grids.",
  },
  {
    slug: "scrap-circuit",
    title: "Scrap Circuit",
    category: "racing",
    description: "Scrappy go-karts and tight circuits.",
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

describe("getSampleGameCategories", () => {
  it("returns a non-empty, de-duplicated category list", () => {
    const categories = getSampleGameCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(new Set(categories).size).toBe(categories.length);
  });
});
