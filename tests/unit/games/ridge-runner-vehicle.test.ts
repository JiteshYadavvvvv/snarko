import { describe, expect, it } from "vitest";
import {
  BASE_VEHICLE_CONFIG,
  GRAVITY,
  createVehicleState,
  stepVehicle,
} from "@/components/games/ridge-runner/engine/vehicle";
import type {
  Terrain,
  VehicleInput,
} from "@/components/games/ridge-runner/engine/types";

const NO_INPUT: VehicleInput = { gas: false, brake: false };

function flatTerrain(groundY: number, length = 10000): Terrain {
  return { segmentWidth: 500, heights: [groundY, groundY], length };
}

describe("createVehicleState", () => {
  it("starts airborne just above the ground", () => {
    const state = createVehicleState(200, 400);
    expect(state.airborne).toBe(true);
    expect(state.fuel).toBe(100);
    expect(state.distanceTraveled).toBe(0);
  });
});

describe("stepVehicle: gravity", () => {
  it("accelerates the chassis downward when far from the ground", () => {
    const terrain = flatTerrain(100000);
    const state = createVehicleState(200, 100000 - 60);
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      NO_INPUT,
      0.1,
    );
    expect(result.state.velocity.y).toBeCloseTo(GRAVITY * 0.1, 0);
    expect(result.state.position.y).toBeGreaterThan(state.position.y);
    expect(result.crashed).toBe(false);
  });
});

describe("stepVehicle: suspension", () => {
  it("pushes the chassis upward when the wheels are deeply compressed", () => {
    const terrain = flatTerrain(400);
    const state = {
      ...createVehicleState(200, 400),
      position: { x: 200, y: 395 },
      velocity: { x: 0, y: 0 },
    };
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      NO_INPUT,
      1 / 60,
    );
    expect(result.state.velocity.y).toBeLessThan(0);
  });
});

describe("stepVehicle: driving", () => {
  it("accelerates forward when grounded with gas held", () => {
    const terrain = flatTerrain(400);
    const state = {
      ...createVehicleState(200, 400),
      position: { x: 200, y: 395 },
      velocity: { x: 0, y: 0 },
    };
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      { gas: true, brake: false },
      1 / 60,
    );
    expect(result.state.velocity.x).toBeGreaterThan(0);
  });

  it("burns fuel while driving forward", () => {
    const terrain = flatTerrain(400);
    const state = {
      ...createVehicleState(200, 400),
      position: { x: 200, y: 395 },
      velocity: { x: 50, y: 0 },
    };
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      { gas: true, brake: false },
      1 / 60,
    );
    expect(result.state.fuel).toBeLessThan(state.fuel);
  });

  it("does not apply drive force when out of fuel", () => {
    const terrain = flatTerrain(400);
    const state = {
      ...createVehicleState(200, 400),
      position: { x: 200, y: 395 },
      velocity: { x: 0, y: 0 },
      fuel: 0,
    };
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      { gas: true, brake: false },
      1 / 60,
    );
    expect(result.state.velocity.x).toBeCloseTo(0, 1);
  });
});

describe("stepVehicle: air control", () => {
  it("applies positive torque while airborne and holding gas", () => {
    const terrain = flatTerrain(100000);
    const state = createVehicleState(200, 100000 - 60);
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      { gas: true, brake: false },
      1 / 60,
    );
    expect(result.state.angularVelocity).toBeGreaterThan(0);
  });

  it("applies negative torque while airborne and holding brake", () => {
    const terrain = flatTerrain(100000);
    const state = createVehicleState(200, 100000 - 60);
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      { gas: false, brake: true },
      1 / 60,
    );
    expect(result.state.angularVelocity).toBeLessThan(0);
  });
});

describe("stepVehicle: crash detection", () => {
  it("reports a crash when the chassis body is already in the ground", () => {
    const terrain = flatTerrain(400);
    const state = {
      ...createVehicleState(200, 400),
      position: { x: 200, y: 500 },
      velocity: { x: 0, y: 0 },
    };
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      NO_INPUT,
      1 / 60,
    );
    expect(result.crashed).toBe(true);
  });

  it("does not crash while safely above the ground", () => {
    const terrain = flatTerrain(100000);
    const state = createVehicleState(200, 100000 - 60);
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      NO_INPUT,
      1 / 60,
    );
    expect(result.crashed).toBe(false);
  });
});

describe("stepVehicle: distance tracking", () => {
  it("tracks the furthest rightward progress from the start", () => {
    const terrain = flatTerrain(400);
    const state = {
      ...createVehicleState(200, 400),
      position: { x: 260, y: 395 },
      velocity: { x: 0, y: 0 },
      distanceTraveled: 40,
    };
    const result = stepVehicle(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      NO_INPUT,
      1 / 60,
    );
    expect(result.state.distanceTraveled).toBeGreaterThanOrEqual(40);
  });
});
