import { describe, expect, it } from "vitest";
import {
  MAX_UPGRADE_LEVEL,
  buildVehicleConfig,
  getUpgradeCost,
} from "@/components/games/ridge-runner/engine/economy";
import { BASE_VEHICLE_CONFIG } from "@/components/games/ridge-runner/engine/vehicle";

describe("getUpgradeCost", () => {
  it("increases cost with each level", () => {
    const level0 = getUpgradeCost("engine", 0);
    const level1 = getUpgradeCost("engine", 1);
    const level2 = getUpgradeCost("engine", 2);
    expect(level1).toBeGreaterThan(level0);
    expect(level2).toBeGreaterThan(level1);
  });

  it("returns Infinity once a category is maxed", () => {
    expect(getUpgradeCost("tires", MAX_UPGRADE_LEVEL)).toBe(Infinity);
  });
});

describe("buildVehicleConfig", () => {
  it("returns the base config at level zero", () => {
    const config = buildVehicleConfig(BASE_VEHICLE_CONFIG, {
      engine: 0,
      suspension: 0,
      tires: 0,
    });
    expect(config.enginePower).toBe(BASE_VEHICLE_CONFIG.enginePower);
    expect(config.suspensionStiffness).toBe(
      BASE_VEHICLE_CONFIG.suspensionStiffness,
    );
    expect(config.tireGrip).toBe(BASE_VEHICLE_CONFIG.tireGrip);
  });

  it("scales the relevant stat upward with each upgrade level", () => {
    const upgraded = buildVehicleConfig(BASE_VEHICLE_CONFIG, {
      engine: 2,
      suspension: 1,
      tires: 3,
    });
    expect(upgraded.enginePower).toBeGreaterThan(
      BASE_VEHICLE_CONFIG.enginePower,
    );
    expect(upgraded.suspensionStiffness).toBeGreaterThan(
      BASE_VEHICLE_CONFIG.suspensionStiffness,
    );
    expect(upgraded.tireGrip).toBeGreaterThan(BASE_VEHICLE_CONFIG.tireGrip);
  });

  it("leaves unrelated dimensions unchanged", () => {
    const upgraded = buildVehicleConfig(BASE_VEHICLE_CONFIG, {
      engine: 4,
      suspension: 4,
      tires: 4,
    });
    expect(upgraded.wheelRadius).toBe(BASE_VEHICLE_CONFIG.wheelRadius);
    expect(upgraded.chassisHalfLength).toBe(
      BASE_VEHICLE_CONFIG.chassisHalfLength,
    );
  });
});
