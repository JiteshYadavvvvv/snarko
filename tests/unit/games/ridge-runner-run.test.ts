import { describe, expect, it } from "vitest";
import {
  COLLECTIBLE_PICKUP_RADIUS,
  RUN_START_X,
  createGarageState,
  pauseRun,
  resumeRun,
  startRun,
  step,
} from "@/components/games/ridge-runner/engine/run";
import { BASE_VEHICLE_CONFIG } from "@/components/games/ridge-runner/engine/vehicle";
import type {
  CollectiblePlacement,
  Terrain,
  VehicleInput,
} from "@/components/games/ridge-runner/engine/types";

const NO_INPUT: VehicleInput = { gas: false, brake: false };

function flatTerrain(groundY: number, length = 10000): Terrain {
  return { segmentWidth: 500, heights: [groundY, groundY], length };
}

describe("createGarageState / startRun", () => {
  it("creates a garage-status run positioned at the start", () => {
    const terrain = flatTerrain(400);
    const state = createGarageState(terrain);
    expect(state.status).toBe("garage");
    expect(state.vehicle.startX).toBe(RUN_START_X);
    expect(state.collectedIds).toEqual([]);
    expect(state.coinsThisRun).toBe(0);
  });

  it("startRun begins in playing status", () => {
    const terrain = flatTerrain(400);
    const state = startRun(terrain);
    expect(state.status).toBe("playing");
  });
});

describe("pauseRun / resumeRun", () => {
  it("only pauses from playing", () => {
    const terrain = flatTerrain(400);
    const garage = createGarageState(terrain);
    expect(pauseRun(garage).status).toBe("garage");

    const playing = startRun(terrain);
    expect(pauseRun(playing).status).toBe("paused");
  });

  it("only resumes from paused", () => {
    const terrain = flatTerrain(400);
    const playing = startRun(terrain);
    expect(resumeRun(playing).status).toBe("playing");

    const paused = pauseRun(playing);
    expect(resumeRun(paused).status).toBe("playing");
  });
});

describe("step", () => {
  it("does nothing when the run is not playing", () => {
    const terrain = flatTerrain(400);
    const state = createGarageState(terrain);
    const result = step(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      [],
      NO_INPUT,
      1 / 60,
    );
    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
  });

  it("collects a coin within pickup radius and updates the run", () => {
    const terrain = flatTerrain(400);
    const state = startRun(terrain);
    const collectible: CollectiblePlacement = {
      id: "coin-1",
      kind: "coin",
      x: state.vehicle.position.x,
      y: state.vehicle.position.y,
    };
    const result = step(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      [collectible],
      NO_INPUT,
      1 / 60,
    );
    expect(result.state.collectedIds).toContain("coin-1");
    expect(result.state.coinsThisRun).toBe(1);
    expect(result.events.some((e) => e.type === "coin-collected")).toBe(true);
  });

  it("refills fuel when a fuel collectible is picked up", () => {
    const terrain = flatTerrain(400);
    const state = {
      ...startRun(terrain),
      vehicle: { ...startRun(terrain).vehicle, fuel: 50 },
    };
    const collectible: CollectiblePlacement = {
      id: "fuel-1",
      kind: "fuel",
      x: state.vehicle.position.x,
      y: state.vehicle.position.y,
    };
    const result = step(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      [collectible],
      NO_INPUT,
      1 / 60,
    );
    expect(result.state.vehicle.fuel).toBeGreaterThan(50);
  });

  it("does not re-collect an already-collected item", () => {
    const terrain = flatTerrain(400);
    const started = startRun(terrain);
    const state = { ...started, collectedIds: ["coin-1"] };
    const collectible: CollectiblePlacement = {
      id: "coin-1",
      kind: "coin",
      x: state.vehicle.position.x,
      y: state.vehicle.position.y,
    };
    const result = step(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      [collectible],
      NO_INPUT,
      1 / 60,
    );
    expect(result.state.coinsThisRun).toBe(0);
  });

  it("ignores a collectible outside the pickup radius", () => {
    const terrain = flatTerrain(400);
    const state = startRun(terrain);
    const collectible: CollectiblePlacement = {
      id: "coin-far",
      kind: "coin",
      x: state.vehicle.position.x + COLLECTIBLE_PICKUP_RADIUS * 10,
      y: state.vehicle.position.y,
    };
    const result = step(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      [collectible],
      NO_INPUT,
      1 / 60,
    );
    expect(result.state.coinsThisRun).toBe(0);
  });

  it("transitions to crashed when the chassis hits the ground", () => {
    const terrain = flatTerrain(400);
    const started = startRun(terrain);
    const state = {
      ...started,
      vehicle: {
        ...started.vehicle,
        position: { x: started.vehicle.position.x, y: 500 },
        velocity: { x: 0, y: 0 },
      },
    };
    const result = step(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      [],
      NO_INPUT,
      1 / 60,
    );
    expect(result.state.status).toBe("crashed");
    expect(result.events.some((e) => e.type === "crashed")).toBe(true);
  });

  it("transitions to out-of-fuel when fuel is empty and the vehicle has stopped", () => {
    const terrain = flatTerrain(400);
    const started = startRun(terrain);
    const state = {
      ...started,
      vehicle: {
        ...started.vehicle,
        position: { x: started.vehicle.position.x, y: 370 },
        velocity: { x: 0, y: 0 },
        rearWheel: { compression: 20, grounded: true },
        frontWheel: { compression: 20, grounded: true },
        fuel: 0,
      },
    };
    const result = step(
      state,
      BASE_VEHICLE_CONFIG,
      terrain,
      [],
      NO_INPUT,
      1 / 60,
    );
    expect(result.state.status).toBe("out-of-fuel");
    expect(result.events.some((e) => e.type === "out-of-fuel")).toBe(true);
  });
});
