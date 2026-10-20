import { BASE_VEHICLE_CONFIG } from "@/components/games/ridge-runner/engine/vehicle";
import type {
  UpgradeCategory,
  UpgradeLevels,
  VehicleConfig,
} from "@/components/games/ridge-runner/engine/types";

export const MAX_UPGRADE_LEVEL = 4;

const UPGRADE_BASE_COST: Record<UpgradeCategory, number> = {
  engine: 40,
  suspension: 30,
  tires: 35,
};

const UPGRADE_LABEL: Record<UpgradeCategory, string> = {
  engine: "Engine",
  suspension: "Suspension",
  tires: "Tires",
};

const UPGRADE_DESCRIPTION: Record<UpgradeCategory, string> = {
  engine: "More drive force for steeper climbs and faster acceleration.",
  suspension: "Stiffer, better-damped springs for calmer landings.",
  tires: "More grip before the wheels break traction.",
};

export function getUpgradeLabel(category: UpgradeCategory): string {
  return UPGRADE_LABEL[category];
}

export function getUpgradeDescription(category: UpgradeCategory): string {
  return UPGRADE_DESCRIPTION[category];
}

export function getUpgradeCost(
  category: UpgradeCategory,
  currentLevel: number,
): number {
  if (currentLevel >= MAX_UPGRADE_LEVEL) {
    return Infinity;
  }
  return Math.round(UPGRADE_BASE_COST[category] * Math.pow(1.6, currentLevel));
}

export function buildVehicleConfig(upgrades: UpgradeLevels): VehicleConfig {
  return {
    ...BASE_VEHICLE_CONFIG,
    enginePower: BASE_VEHICLE_CONFIG.enginePower * (1 + 0.22 * upgrades.engine),
    suspensionStiffness:
      BASE_VEHICLE_CONFIG.suspensionStiffness *
      (1 + 0.15 * upgrades.suspension),
    suspensionDamping:
      BASE_VEHICLE_CONFIG.suspensionDamping * (1 + 0.18 * upgrades.suspension),
    tireGrip: BASE_VEHICLE_CONFIG.tireGrip * (1 + 0.15 * upgrades.tires),
  };
}
