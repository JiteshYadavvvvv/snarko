import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "@/components/games/ridge-runner/engine/achievements";
import {
  OBJECTIVES,
  getObjectivesForStage,
} from "@/components/games/ridge-runner/engine/objectives";
import { createDefaultSave } from "@/components/games/ridge-runner/engine/progression";
import type { RunResult } from "@/components/games/ridge-runner/engine/types";

function result(overrides: Partial<RunResult> = {}): RunResult {
  return {
    stageId: "countryside",
    vehicleId: "scout-buggy",
    distance: 0,
    coinsThisRun: 0,
    crashed: true,
    outOfFuel: false,
    finished: false,
    ...overrides,
  };
}

describe("objectives", () => {
  it("getObjectivesForStage only returns that stage's objectives", () => {
    const countryside = getObjectivesForStage("countryside");
    expect(countryside.length).toBeGreaterThan(0);
    expect(countryside.every((o) => o.stageId === "countryside")).toBe(true);
  });

  it("every objective id is unique", () => {
    const ids = new Set(OBJECTIVES.map((o) => o.id));
    expect(ids.size).toBe(OBJECTIVES.length);
  });

  it("a distance objective does not complete below its threshold", () => {
    const objective = OBJECTIVES.find((o) => o.id === "countryside-travel-500");
    expect(objective).toBeDefined();
    expect(objective!.isComplete(result({ distance: 499 }))).toBe(false);
    expect(objective!.isComplete(result({ distance: 500 }))).toBe(true);
  });
});

describe("achievements", () => {
  it("rough-start unlocks only after a crash is recorded", () => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === "rough-start")!;
    const save = createDefaultSave();
    expect(achievement.isUnlocked(save)).toBe(false);
    expect(achievement.isUnlocked({ ...save, totalCrashes: 1 })).toBe(true);
  });

  it("vehicle-collector requires a second unlocked vehicle", () => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === "vehicle-collector")!;
    const save = createDefaultSave();
    expect(achievement.isUnlocked(save)).toBe(false);
    const withSecond = {
      ...save,
      vehicles: {
        ...save.vehicles,
        "hauler-truck": {
          unlocked: true,
          upgrades: { engine: 0, suspension: 0, tires: 0 },
        },
      },
    };
    expect(achievement.isUnlocked(withSecond)).toBe(true);
  });
});
