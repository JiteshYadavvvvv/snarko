import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SAVE,
  applyRunResult,
  loadSave,
  persistSave,
  purchaseUpgrade,
} from "@/components/games/ridge-runner/engine/progression";
import { getUpgradeCost } from "@/components/games/ridge-runner/engine/economy";

beforeEach(() => {
  window.localStorage.clear();
});

describe("loadSave", () => {
  it("returns the default save when nothing is stored", () => {
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });

  it("round-trips a persisted save", () => {
    const save = {
      coins: 120,
      bestDistance: 3400,
      upgrades: { engine: 2, suspension: 1, tires: 0 },
    };
    persistSave(save);
    expect(loadSave()).toEqual(save);
  });

  it("falls back to defaults for malformed stored data", () => {
    window.localStorage.setItem("snarko:ridge-runner:save", "not json");
    expect(loadSave()).toEqual(DEFAULT_SAVE);
  });
});

describe("applyRunResult", () => {
  it("adds coins and keeps the best distance", () => {
    const save = { ...DEFAULT_SAVE, coins: 10, bestDistance: 500 };
    const next = applyRunResult(save, 300, 15);
    expect(next.coins).toBe(25);
    expect(next.bestDistance).toBe(500);
  });

  it("raises the best distance on a new record", () => {
    const save = { ...DEFAULT_SAVE, bestDistance: 500 };
    const next = applyRunResult(save, 900.4, 0);
    expect(next.bestDistance).toBe(900);
  });
});

describe("purchaseUpgrade", () => {
  it("deducts coins and raises the level when affordable", () => {
    const cost = getUpgradeCost("engine", 0);
    const save = {
      ...DEFAULT_SAVE,
      coins: cost,
      upgrades: { engine: 0, suspension: 0, tires: 0 },
    };
    const next = purchaseUpgrade(save, "engine");
    expect(next.upgrades.engine).toBe(1);
    expect(next.coins).toBe(0);
  });

  it("does nothing when coins are insufficient", () => {
    const save = {
      ...DEFAULT_SAVE,
      coins: 0,
      upgrades: { engine: 0, suspension: 0, tires: 0 },
    };
    const next = purchaseUpgrade(save, "engine");
    expect(next).toEqual(save);
  });
});
