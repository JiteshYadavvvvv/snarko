import {
  createVehicleState,
  stepVehicle,
} from "@/components/games/ridge-runner/engine/vehicle";
import { groundHeightAt } from "@/components/games/ridge-runner/engine/terrain";
import type {
  CollectiblePlacement,
  RunEvent,
  RunState,
  RunStepResult,
  Terrain,
  VehicleConfig,
  VehicleInput,
} from "@/components/games/ridge-runner/engine/types";

export const RUN_START_X = 220;
export const COLLECTIBLE_PICKUP_RADIUS = 34;
export const FUEL_REFILL_AMOUNT = 42;
export const SUBSTEPS = 4;
export const MAX_FRAME_DELTA = 1 / 20;

export function createIdleState(
  terrain: Terrain,
  stageId: string,
  vehicleId: string,
): RunState {
  const groundY = groundHeightAt(terrain, RUN_START_X);
  return {
    status: "idle",
    stageId,
    vehicleId,
    vehicle: createVehicleState(RUN_START_X, groundY),
    collectedIds: [],
    coinsThisRun: 0,
    distance: 0,
  };
}

export function startRun(
  terrain: Terrain,
  stageId: string,
  vehicleId: string,
): RunState {
  const groundY = groundHeightAt(terrain, RUN_START_X);
  return {
    status: "playing",
    stageId,
    vehicleId,
    vehicle: createVehicleState(RUN_START_X, groundY),
    collectedIds: [],
    coinsThisRun: 0,
    distance: 0,
  };
}

export function pauseRun(state: RunState): RunState {
  if (state.status !== "playing") {
    return state;
  }
  return { ...state, status: "paused" };
}

export function resumeRun(state: RunState): RunState {
  if (state.status !== "paused") {
    return state;
  }
  return { ...state, status: "playing" };
}

function distanceBetween(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.hypot(ax - bx, ay - by);
}

export function step(
  state: RunState,
  config: VehicleConfig,
  terrain: Terrain,
  collectibles: CollectiblePlacement[],
  input: VehicleInput,
  dtSeconds: number,
): RunStepResult {
  if (state.status !== "playing") {
    return { state, events: [] };
  }

  const events: RunEvent[] = [];
  const clampedDt = Math.min(MAX_FRAME_DELTA, dtSeconds);
  const subDt = clampedDt / SUBSTEPS;

  const wasAirborne = state.vehicle.airborne;
  let vehicle = state.vehicle;
  let crashed = false;

  for (let i = 0; i < SUBSTEPS; i += 1) {
    const result = stepVehicle(vehicle, config, terrain, input, subDt);
    vehicle = result.state;
    if (result.justLanded) {
      events.push({ type: "landed" });
    }
    if (result.crashed) {
      crashed = true;
      break;
    }
  }

  if (!wasAirborne && vehicle.airborne) {
    events.push({ type: "airborne" });
  }

  if (crashed) {
    events.push({ type: "crashed" });
    return {
      state: {
        ...state,
        status: "crashed",
        vehicle,
        distance: vehicle.distanceTraveled,
      },
      events,
    };
  }

  const collectedIds = [...state.collectedIds];
  let coinsThisRun = state.coinsThisRun;
  let fuel = vehicle.fuel;

  for (const collectible of collectibles) {
    if (collectedIds.includes(collectible.id)) {
      continue;
    }
    const distance = distanceBetween(
      vehicle.position.x,
      vehicle.position.y,
      collectible.x,
      collectible.y,
    );
    if (distance <= COLLECTIBLE_PICKUP_RADIUS) {
      collectedIds.push(collectible.id);
      if (collectible.kind === "coin") {
        coinsThisRun += 1;
        events.push({ type: "coin-collected" });
      } else {
        fuel = Math.min(config.maxFuel, fuel + FUEL_REFILL_AMOUNT);
        events.push({ type: "fuel-collected" });
      }
    }
  }

  const vehicleWithFuel =
    fuel === vehicle.fuel ? vehicle : { ...vehicle, fuel };
  const speed = Math.hypot(
    vehicleWithFuel.velocity.x,
    vehicleWithFuel.velocity.y,
  );

  if (vehicleWithFuel.fuel <= 0 && speed < 8) {
    events.push({ type: "out-of-fuel" });
    return {
      state: {
        ...state,
        status: "out-of-fuel",
        vehicle: vehicleWithFuel,
        collectedIds,
        coinsThisRun,
        distance: vehicleWithFuel.distanceTraveled,
      },
      events,
    };
  }

  return {
    state: {
      ...state,
      vehicle: vehicleWithFuel,
      collectedIds,
      coinsThisRun,
      distance: vehicleWithFuel.distanceTraveled,
    },
    events,
  };
}
