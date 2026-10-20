import { describe, expect, it } from "vitest";
import {
  DEFAULT_VEHICLE_ID,
  VEHICLES,
  getVehicleDefinition,
} from "@/components/games/ridge-runner/engine/vehicles";

describe("VEHICLES", () => {
  it("has a free starter vehicle matching DEFAULT_VEHICLE_ID", () => {
    const starter = getVehicleDefinition(DEFAULT_VEHICLE_ID);
    expect(starter.cost).toBe(0);
  });

  it("every other vehicle costs coins to unlock", () => {
    const others = VEHICLES.filter((v) => v.id !== DEFAULT_VEHICLE_ID);
    expect(others.length).toBeGreaterThan(0);
    for (const vehicle of others) {
      expect(vehicle.cost).toBeGreaterThan(0);
    }
  });

  it("every vehicle has a distinct id and physically plausible config", () => {
    const ids = new Set(VEHICLES.map((v) => v.id));
    expect(ids.size).toBe(VEHICLES.length);
    for (const vehicle of VEHICLES) {
      expect(vehicle.baseConfig.mass).toBeGreaterThan(0);
      expect(vehicle.baseConfig.suspensionRestLength).toBeGreaterThan(0);
      expect(vehicle.baseConfig.enginePower).toBeGreaterThan(0);
    }
  });

  it("falls back to the first vehicle for an unknown id", () => {
    expect(getVehicleDefinition("not-a-real-vehicle")).toBe(VEHICLES[0]);
  });
});
