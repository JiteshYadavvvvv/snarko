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

export function buildVehicleConfig(
  baseConfig: VehicleConfig,
  upgrades: UpgradeLevels,
): VehicleConfig {
  return {
    ...baseConfig,
    enginePower: baseConfig.enginePower * (1 + 0.22 * upgrades.engine),
    suspensionStiffness:
      baseConfig.suspensionStiffness * (1 + 0.15 * upgrades.suspension),
    suspensionDamping:
      baseConfig.suspensionDamping * (1 + 0.18 * upgrades.suspension),
    tireGrip: baseConfig.tireGrip * (1 + 0.15 * upgrades.tires),
  };
}
