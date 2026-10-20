import { describe, expect, it } from "vitest";
import {
  GAME_CATEGORIES,
  GAME_CATEGORY_META,
  isGameCategory,
} from "@/constants/game-categories";

describe("isGameCategory", () => {
  it("accepts every known category", () => {
    for (const category of GAME_CATEGORIES) {
      expect(isGameCategory(category)).toBe(true);
    }
  });

  it("rejects an unknown category slug", () => {
    expect(isGameCategory("strategy")).toBe(false);
    expect(isGameCategory("")).toBe(false);
  });
});

describe("GAME_CATEGORY_META", () => {
  it("has a label, description, and icon for every known category", () => {
    for (const category of GAME_CATEGORIES) {
      const meta = GAME_CATEGORY_META[category];
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.description.length).toBeGreaterThan(0);
      expect(meta.icon).toBeDefined();
    }
  });
});
