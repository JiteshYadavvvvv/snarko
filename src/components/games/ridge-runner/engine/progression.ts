import {
  MAX_UPGRADE_LEVEL,
  getUpgradeCost,
} from "@/components/games/ridge-runner/engine/economy";
import type {
  SaveData,
  UpgradeCategory,
} from "@/components/games/ridge-runner/engine/types";

const STORAGE_KEY = "snarko:ridge-runner:save";

export const DEFAULT_SAVE: SaveData = {
  coins: 0,
  bestDistance: 0,
  upgrades: { engine: 0, suspension: 0, tires: 0 },
};

export function loadSave(): SaveData {
  if (typeof window === "undefined") {
    return DEFAULT_SAVE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SAVE;
    }
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      coins:
        typeof parsed.coins === "number" ? parsed.coins : DEFAULT_SAVE.coins,
      bestDistance:
        typeof parsed.bestDistance === "number"
          ? parsed.bestDistance
          : DEFAULT_SAVE.bestDistance,
      upgrades: {
        ...DEFAULT_SAVE.upgrades,
        ...parsed.upgrades,
      },
    };
  } catch {
    return DEFAULT_SAVE;
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

export function applyRunResult(
  save: SaveData,
  distance: number,
  coinsEarned: number,
): SaveData {
  return {
    ...save,
    coins: save.coins + coinsEarned,
    bestDistance: Math.max(save.bestDistance, Math.round(distance)),
  };
}

export function purchaseUpgrade(
  save: SaveData,
  category: UpgradeCategory,
): SaveData {
  const level = save.upgrades[category];
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
    upgrades: { ...save.upgrades, [category]: level + 1 },
  };
}
