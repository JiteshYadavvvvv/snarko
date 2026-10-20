import { MAX_UPGRADE_LEVEL } from "@/components/games/ridge-runner/engine/economy";
import type { AchievementDefinition } from "@/components/games/ridge-runner/engine/types";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "rough-start",
    name: "Rough Start",
    description: "Crash for the first time.",
    isUnlocked: (save) => save.totalCrashes >= 1,
  },
  {
    id: "thousand-club",
    name: "Thousand Club",
    description: "Reach 1000m best distance on any stage.",
    isUnlocked: (save) =>
      Object.values(save.stageBestDistance).some(
        (distance) => distance >= 1000,
      ),
  },
  {
    id: "vehicle-collector",
    name: "Vehicle Collector",
    description: "Unlock a second vehicle.",
    isUnlocked: (save) =>
      Object.values(save.vehicles).filter((vehicle) => vehicle.unlocked)
        .length >= 2,
  },
  {
    id: "max-tune",
    name: "Max Tune",
    description: "Fully upgrade engine, suspension, and tires on any vehicle.",
    isUnlocked: (save) =>
      Object.values(save.vehicles).some(
        (vehicle) =>
          vehicle.upgrades.engine >= MAX_UPGRADE_LEVEL &&
          vehicle.upgrades.suspension >= MAX_UPGRADE_LEVEL &&
          vehicle.upgrades.tires >= MAX_UPGRADE_LEVEL,
      ),
  },
];
