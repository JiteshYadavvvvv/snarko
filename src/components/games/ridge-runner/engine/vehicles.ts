import { BASE_VEHICLE_CONFIG } from "@/components/games/ridge-runner/engine/vehicle";
import type { VehicleDefinition } from "@/components/games/ridge-runner/engine/types";

export const DEFAULT_VEHICLE_ID = "scout-buggy";

export const VEHICLES: VehicleDefinition[] = [
  {
    id: "scout-buggy",
    name: "Scout Buggy",
    description: "Balanced and easy to drive. The starting vehicle.",
    cost: 0,
    baseConfig: BASE_VEHICLE_CONFIG,
    bodyColor: "#e63b42",
    accentColor: "#140405",
  },
  {
    id: "hauler-truck",
    name: "Hauler Truck",
    description:
      "Heavier chassis with a bigger tank and tougher suspension travel. Slower off the line, steadier over bumps.",
    cost: 220,
    baseConfig: {
      mass: 32,
      wheelRadius: 19,
      wheelBaseHalf: 52,
      chassisHalfLength: 56,
      chassisHalfHeight: 16,
      enginePower: 17600,
      brakeForce: 15400,
      suspensionRestLength: 42,
      suspensionStiffness: 900,
      suspensionDamping: 180,
      tireGrip: 1.5,
      airControlTorque: 81000,
      maxFuel: 120,
      fuelBurnPerUnit: 0.052,
      fuelBurnIdlePerSecond: 0.7,
    },
    bodyColor: "#3bc9e6",
    accentColor: "#0b2e36",
  },
  {
    id: "rally-hatch",
    name: "Rally Hatch",
    description:
      "Light and nimble with sharp acceleration and twitchy air control, but a smaller tank and less grip margin.",
    cost: 260,
    baseConfig: {
      mass: 14,
      wheelRadius: 14,
      wheelBaseHalf: 40,
      chassisHalfLength: 44,
      chassisHalfHeight: 12,
      enginePower: 14000,
      brakeForce: 12250,
      suspensionRestLength: 28,
      suspensionStiffness: 580,
      suspensionDamping: 116,
      tireGrip: 1.15,
      airControlTorque: 60000,
      maxFuel: 85,
      fuelBurnPerUnit: 0.04,
      fuelBurnIdlePerSecond: 0.5,
    },
    bodyColor: "#e6b93b",
    accentColor: "#3a2c06",
  },
];

export function getVehicleDefinition(id: string): VehicleDefinition {
  const vehicle = VEHICLES.find((candidate) => candidate.id === id);
  return vehicle ?? VEHICLES[0];
}
