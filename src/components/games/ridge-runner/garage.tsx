import { Coins, Gauge, Settings2, Wrench } from "lucide-react";
import {
  MAX_UPGRADE_LEVEL,
  getUpgradeCost,
  getUpgradeDescription,
  getUpgradeLabel,
} from "@/components/games/ridge-runner/engine/economy";
import { VEHICLES } from "@/components/games/ridge-runner/engine/vehicles";
import type {
  SaveData,
  UpgradeCategory,
} from "@/components/games/ridge-runner/engine/types";
import { VehiclePreview } from "@/components/games/ridge-runner/vehicle-preview";
import { Button } from "@/components/ui/button";

const UPGRADE_ICONS: Record<UpgradeCategory, typeof Gauge> = {
  engine: Gauge,
  suspension: Settings2,
  tires: Wrench,
};

const UPGRADE_ORDER: UpgradeCategory[] = ["engine", "suspension", "tires"];

function UpgradeRow({
  category,
  level,
  coins,
  onPurchase,
}: {
  category: UpgradeCategory;
  level: number;
  coins: number;
  onPurchase: (category: UpgradeCategory) => void;
}) {
  const Icon = UPGRADE_ICONS[category];
  const maxed = level >= MAX_UPGRADE_LEVEL;
  const cost = getUpgradeCost(category, level);
  const canAfford = !maxed && coins >= cost;

  return (
    <div className="border-border flex items-center justify-between gap-4 border-t py-3 first:border-t-0">
      <div className="flex items-center gap-3">
        <Icon className="text-brand-red size-5" aria-hidden="true" />
        <div>
          <p className="text-foreground text-sm font-semibold">
            {getUpgradeLabel(category)}
          </p>
          <p className="text-muted-foreground max-w-xs text-xs">
            {getUpgradeDescription(category)}
          </p>
          <div
            className="mt-1.5 flex items-center gap-1"
            role="img"
            aria-label={`Level ${level} of ${MAX_UPGRADE_LEVEL}`}
          >
            {Array.from({ length: MAX_UPGRADE_LEVEL }).map((_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className={`h-1.5 w-5 rounded-full ${
                  index < level ? "bg-brand-red" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <Button
        variant="secondary"
        disabled={!canAfford}
        onClick={() => onPurchase(category)}
        className="shrink-0"
      >
        {maxed ? "Maxed" : `${cost}`}
      </Button>
    </div>
  );
}

export function Garage({
  save,
  bestDistanceLabel,
  onSelectVehicle,
  onPurchaseVehicle,
  onPurchaseUpgrade,
  onBack,
  onDrive,
}: {
  save: SaveData;
  bestDistanceLabel: string;
  onSelectVehicle: (vehicleId: string) => void;
  onPurchaseVehicle: (vehicleId: string) => void;
  onPurchaseUpgrade: (category: UpgradeCategory) => void;
  onBack: () => void;
  onDrive: () => void;
}) {
  const selectedVehicleId = save.selectedVehicleId;
  const selectedState = save.vehicles[selectedVehicleId];

  return (
    <div className="flex flex-col gap-4 p-2 text-center sm:p-4">
      <div>
        <h2 className="text-foreground text-2xl font-bold">Garage</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Gas to climb, brake to settle, lean in the air to land clean.
        </p>
      </div>

      <div className="text-foreground flex items-center justify-center gap-6 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="text-brand-red size-4" aria-hidden="true" />
          {save.coins} coins
        </span>
        <span>Best distance: {bestDistanceLabel}</span>
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {VEHICLES.map((vehicle) => {
          const state = save.vehicles[vehicle.id];
          const isSelected = vehicle.id === selectedVehicleId;
          return (
            <li key={vehicle.id}>
              <button
                type="button"
                onClick={() =>
                  state.unlocked
                    ? onSelectVehicle(vehicle.id)
                    : onPurchaseVehicle(vehicle.id)
                }
                disabled={!state.unlocked && save.coins < vehicle.cost}
                className={`bg-surface-elevated flex w-full flex-col items-center gap-1 rounded-lg border p-2 disabled:opacity-50 ${
                  isSelected ? "border-brand-red" : "border-border"
                }`}
              >
                <VehiclePreview vehicle={vehicle} className="h-12 w-full" />
                <span className="text-foreground text-xs font-semibold">
                  {vehicle.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {state.unlocked
                    ? isSelected
                      ? "Selected"
                      : "Select"
                    : `${vehicle.cost} coins`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedState && (
        <div className="bg-surface-elevated rounded-lg px-4 text-left">
          {UPGRADE_ORDER.map((category) => (
            <UpgradeRow
              key={category}
              category={category}
              level={selectedState.upgrades[category]}
              coins={save.coins}
              onPurchase={onPurchaseUpgrade}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2">
        <Button variant="ghost" onClick={onBack}>
          World Map
        </Button>
        <Button onClick={onDrive}>Drive</Button>
      </div>
    </div>
  );
}
