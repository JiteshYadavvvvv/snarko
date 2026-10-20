import { beforeEach, describe, expect, it } from "vitest";
import {
  createDefaultSave,
  applyRunResult,
  loadSave,
  persistSave,
  purchaseUpgrade,
  purchaseVehicle,
  selectVehicle,
} from "@/components/games/ridge-runner/engine/progression";
import { getUpgradeCost } from "@/components/games/ridge-runner/engine/economy";
import { OBJECTIVES } from "@/components/games/ridge-runner/engine/objectives";
import { DEFAULT_VEHICLE_ID } from "@/components/games/ridge-runner/engine/vehicles";
import type { RunResult } from "@/components/games/ridge-runner/engine/types";

beforeEach(() => {
  window.localStorage.clear();
});

function baseResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    stageId: "countryside",
    vehicleId: DEFAULT_VEHICLE_ID,
    distance: 300,
    coinsThisRun: 0,
    crashed: true,
    outOfFuel: false,
    finished: false,
    ...overrides,
  };
}

describe("loadSave", () => {
  it("returns the default save when nothing is stored", () => {
    expect(loadSave()).toEqual(createDefaultSave());
  });

  it("round-trips a persisted save", () => {
    const save = {
      ...createDefaultSave(),
      coins: 120,
      stageBestDistance: { countryside: 3400 },
    };
    persistSave(save);
    expect(loadSave()).toEqual(save);
  });

  it("falls back to defaults for malformed stored data", () => {
    window.localStorage.setItem("snarko:ridge-runner:save", "not json");
    expect(loadSave()).toEqual(createDefaultSave());
  });
});

describe("applyRunResult", () => {
  it("adds coins and keeps the best distance when it is not beaten", () => {
    const save = {
      ...createDefaultSave(),
      coins: 10,
      stageBestDistance: { countryside: 500 },
    };
    const outcome = applyRunResult(
      save,
      baseResult({ distance: 300, coinsThisRun: 2 }),
    );
    expect(outcome.save.coins).toBe(12);
    expect(outcome.save.stageBestDistance.countryside).toBe(500);
  });

  it("raises the best distance on a new record", () => {
    const save = {
      ...createDefaultSave(),
      stageBestDistance: { countryside: 500 },
    };
    const outcome = applyRunResult(save, baseResult({ distance: 900.4 }));
    expect(outcome.save.stageBestDistance.countryside).toBe(900);
  });

  it("awards a one-time objective bonus and reports it as newly completed", () => {
    const save = createDefaultSave();
    const outcome = applyRunResult(
      save,
      baseResult({ distance: 600, coinsThisRun: 0 }),
    );
    expect(outcome.newObjectiveIds).toContain("countryside-travel-500");
    expect(outcome.save.completedObjectiveIds).toContain(
      "countryside-travel-500",
    );
    expect(outcome.save.coins).toBeGreaterThan(0);

    const repeated = applyRunResult(
      outcome.save,
      baseResult({ distance: 600, coinsThisRun: 0 }),
    );
    expect(repeated.newObjectiveIds).not.toContain("countryside-travel-500");
  });

  it("increments run and crash counters", () => {
    const save = createDefaultSave();
    const outcome = applyRunResult(save, baseResult({ crashed: true }));
    expect(outcome.save.totalRuns).toBe(1);
    expect(outcome.save.totalCrashes).toBe(1);
  });

  it("awards a one-time stage completion bonus and tracks it, without duplicating on replay", () => {
    const save = createDefaultSave();
    const outcome = applyRunResult(
      save,
      baseResult({ distance: 900, crashed: false, finished: true }),
    );
    expect(outcome.newlyCompletedStage).toBe(true);
    expect(outcome.completionReward).toBeGreaterThan(0);
    expect(outcome.save.completedStageIds).toContain("countryside");
    expect(outcome.save.coins).toBe(
      outcome.completionReward +
        outcome.newObjectiveIds.reduce((sum, id) => {
          const objective = OBJECTIVES.find((o) => o.id === id);
          return sum + (objective?.reward ?? 0);
        }, 0),
    );

    const replay = applyRunResult(
      outcome.save,
      baseResult({ distance: 900, crashed: false, finished: true }),
    );
    expect(replay.newlyCompletedStage).toBe(false);
    expect(replay.completionReward).toBe(0);
    expect(replay.save.completedStageIds).toEqual(["countryside"]);
  });
});

describe("purchaseVehicle / selectVehicle", () => {
  it("unlocks a vehicle and deducts its cost when affordable", () => {
    const save = { ...createDefaultSave(), coins: 500 };
    const next = purchaseVehicle(save, "hauler-truck");
    expect(next.vehicles["hauler-truck"].unlocked).toBe(true);
    expect(next.coins).toBe(500 - 220);
  });

  it("does nothing when coins are insufficient", () => {
    const save = { ...createDefaultSave(), coins: 0 };
    const next = purchaseVehicle(save, "hauler-truck");
    expect(next).toEqual(save);
  });

  it("only selects an unlocked vehicle", () => {
    const save = createDefaultSave();
    const next = selectVehicle(save, "hauler-truck");
    expect(next.selectedVehicleId).toBe(DEFAULT_VEHICLE_ID);
  });
});

describe("purchaseUpgrade", () => {
  it("deducts coins and raises the level when affordable", () => {
    const cost = getUpgradeCost("engine", 0);
    const save = { ...createDefaultSave(), coins: cost };
    const next = purchaseUpgrade(save, DEFAULT_VEHICLE_ID, "engine");
    expect(next.vehicles[DEFAULT_VEHICLE_ID].upgrades.engine).toBe(1);
    expect(next.coins).toBe(0);
  });

  it("does nothing when coins are insufficient", () => {
    const save = { ...createDefaultSave(), coins: 0 };
    const next = purchaseUpgrade(save, DEFAULT_VEHICLE_ID, "engine");
    expect(next).toEqual(save);
  });
});
