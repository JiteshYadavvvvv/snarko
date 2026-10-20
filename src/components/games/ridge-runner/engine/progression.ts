import { ACHIEVEMENTS } from "@/components/games/ridge-runner/engine/achievements";
import {
  MAX_UPGRADE_LEVEL,
  getUpgradeCost,
} from "@/components/games/ridge-runner/engine/economy";
import { OBJECTIVES } from "@/components/games/ridge-runner/engine/objectives";
import {
  DEFAULT_VEHICLE_ID,
  VEHICLES,
} from "@/components/games/ridge-runner/engine/vehicles";
import type {
  RunResult,
  SaveData,
  UpgradeCategory,
  VehicleSaveState,
} from "@/components/games/ridge-runner/engine/types";

const STORAGE_KEY = "snarko:ridge-runner:save";

function defaultVehicleStates(): Record<string, VehicleSaveState> {
  const states: Record<string, VehicleSaveState> = {};
  for (const vehicle of VEHICLES) {
    states[vehicle.id] = {
      unlocked: vehicle.cost === 0,
      upgrades: { engine: 0, suspension: 0, tires: 0 },
    };
  }
  return states;
}

export function createDefaultSave(): SaveData {
  return {
    coins: 0,
    selectedVehicleId: DEFAULT_VEHICLE_ID,
    vehicles: defaultVehicleStates(),
    stageBestDistance: {},
    completedObjectiveIds: [],
    unlockedAchievementIds: [],
    totalRuns: 0,
    totalCrashes: 0,
  };
}

export function loadSave(): SaveData {
  const fallback = createDefaultSave();
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      coins: typeof parsed.coins === "number" ? parsed.coins : fallback.coins,
      selectedVehicleId:
        typeof parsed.selectedVehicleId === "string"
          ? parsed.selectedVehicleId
          : fallback.selectedVehicleId,
      vehicles: { ...fallback.vehicles, ...parsed.vehicles },
      stageBestDistance: {
        ...fallback.stageBestDistance,
        ...parsed.stageBestDistance,
      },
      completedObjectiveIds: Array.isArray(parsed.completedObjectiveIds)
        ? parsed.completedObjectiveIds
        : fallback.completedObjectiveIds,
      unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds)
        ? parsed.unlockedAchievementIds
        : fallback.unlockedAchievementIds,
      totalRuns:
        typeof parsed.totalRuns === "number"
          ? parsed.totalRuns
          : fallback.totalRuns,
      totalCrashes:
        typeof parsed.totalCrashes === "number"
          ? parsed.totalCrashes
          : fallback.totalCrashes,
    };
  } catch {
    return fallback;
  }
}

export function persistSave(save: SaveData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    return;
  }
}

export interface ApplyRunResultOutcome {
  save: SaveData;
  newObjectiveIds: string[];
  newAchievementIds: string[];
}

export function applyRunResult(
  save: SaveData,
  result: RunResult,
): ApplyRunResultOutcome {
  const previousBest = save.stageBestDistance[result.stageId] ?? 0;
  const nextBest = Math.max(previousBest, Math.round(result.distance));

  let coins = save.coins + result.coinsThisRun;
  const completedObjectiveIds = [...save.completedObjectiveIds];
  const newObjectiveIds: string[] = [];

  for (const objective of OBJECTIVES) {
    if (objective.stageId !== result.stageId) {
      continue;
    }
    if (completedObjectiveIds.includes(objective.id)) {
      continue;
    }
    if (objective.isComplete(result)) {
      completedObjectiveIds.push(objective.id);
      newObjectiveIds.push(objective.id);
      coins += objective.reward;
    }
  }

  const updated: SaveData = {
    ...save,
    coins,
    stageBestDistance: {
      ...save.stageBestDistance,
      [result.stageId]: nextBest,
    },
    completedObjectiveIds,
    totalRuns: save.totalRuns + 1,
    totalCrashes: save.totalCrashes + (result.crashed ? 1 : 0),
  };

  const unlockedAchievementIds = [...updated.unlockedAchievementIds];
  const newAchievementIds: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedAchievementIds.includes(achievement.id)) {
      continue;
    }
    if (achievement.isUnlocked(updated)) {
      unlockedAchievementIds.push(achievement.id);
      newAchievementIds.push(achievement.id);
    }
  }

  return {
    save: { ...updated, unlockedAchievementIds },
    newObjectiveIds,
    newAchievementIds,
  };
}

export function purchaseVehicle(save: SaveData, vehicleId: string): SaveData {
  const vehicle = VEHICLES.find((candidate) => candidate.id === vehicleId);
  const state = save.vehicles[vehicleId];
  if (!vehicle || !state || state.unlocked || save.coins < vehicle.cost) {
    return save;
  }

  return {
    ...save,
    coins: save.coins - vehicle.cost,
    vehicles: {
      ...save.vehicles,
      [vehicleId]: { ...state, unlocked: true },
    },
  };
}

export function selectVehicle(save: SaveData, vehicleId: string): SaveData {
  const state = save.vehicles[vehicleId];
  if (!state || !state.unlocked) {
    return save;
  }
  return { ...save, selectedVehicleId: vehicleId };
}

export function purchaseUpgrade(
  save: SaveData,
  vehicleId: string,
  category: UpgradeCategory,
): SaveData {
  const state = save.vehicles[vehicleId];
  if (!state || !state.unlocked) {
    return save;
  }

  const level = state.upgrades[category];
  if (level >= MAX_UPGRADE_LEVEL) {
    return save;
  }

  const cost = getUpgradeCost(category, level);
  if (save.coins < cost) {
    return save;
  }

  return {
    ...save,
    coins: save.coins - cost,
    vehicles: {
      ...save.vehicles,
      [vehicleId]: {
        ...state,
        upgrades: { ...state.upgrades, [category]: level + 1 },
      },
    },
  };
}
