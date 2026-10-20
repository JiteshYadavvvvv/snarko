export interface Vector2 {
  x: number;
  y: number;
}

export interface TerrainConfig {
  seed: number;
  segmentWidth: number;
  segmentCount: number;
  baselineY: number;
  baseAmplitude: number;
  baseFrequency: number;
  difficultyRamp: number;
  minHeight: number;
  maxHeight: number;
}

export interface Terrain {
  segmentWidth: number;
  heights: number[];
  length: number;
}

export type CollectibleKind = "fuel" | "coin";

export interface CollectiblePlacement {
  id: string;
  kind: CollectibleKind;
  x: number;
  y: number;
}

export interface VehicleConfig {
  mass: number;
  wheelRadius: number;
  wheelBaseHalf: number;
  chassisHalfLength: number;
  chassisHalfHeight: number;
  enginePower: number;
  brakeForce: number;
  suspensionRestLength: number;
  suspensionStiffness: number;
  suspensionDamping: number;
  tireGrip: number;
  airControlTorque: number;
  maxFuel: number;
  fuelBurnPerUnit: number;
  fuelBurnIdlePerSecond: number;
}

export interface WheelState {
  compression: number;
  grounded: boolean;
}

export interface VehicleState {
  startX: number;
  position: Vector2;
  velocity: Vector2;
  angle: number;
  angularVelocity: number;
  rearWheel: WheelState;
  frontWheel: WheelState;
  fuel: number;
  distanceTraveled: number;
  airborne: boolean;
}

export interface VehicleInput {
  gas: boolean;
  brake: boolean;
}

export interface VehicleStepResult {
  state: VehicleState;
  crashed: boolean;
  justLanded: boolean;
}

export type UpgradeCategory = "engine" | "suspension" | "tires";

export interface UpgradeLevels {
  engine: number;
  suspension: number;
  tires: number;
}

export interface VehicleDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  baseConfig: VehicleConfig;
  bodyColor: string;
  accentColor: string;
}

export type UnlockRequirement =
  | { type: "always" }
  | { type: "stage-distance"; stageId: string; distance: number };

export interface StagePalette {
  skyTop: string;
  skyBottom: string;
  groundFill: string;
  groundFarFill: string;
  groundEdge: string;
}

export interface StageDefinition {
  id: string;
  name: string;
  description: string;
  terrainConfig: TerrainConfig;
  unlock: UnlockRequirement;
  palette: StagePalette;
}

export interface RunResult {
  stageId: string;
  vehicleId: string;
  distance: number;
  coinsThisRun: number;
  crashed: boolean;
  outOfFuel: boolean;
}

export interface ObjectiveDefinition {
  id: string;
  stageId: string;
  label: string;
  reward: number;
  isComplete: (result: RunResult) => boolean;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  isUnlocked: (save: SaveData) => boolean;
}

export interface VehicleSaveState {
  unlocked: boolean;
  upgrades: UpgradeLevels;
}

export interface SaveData {
  coins: number;
  selectedVehicleId: string;
  vehicles: Record<string, VehicleSaveState>;
  stageBestDistance: Record<string, number>;
  completedObjectiveIds: string[];
  unlockedAchievementIds: string[];
  totalRuns: number;
  totalCrashes: number;
}

export type RunStatus =
  "idle" | "playing" | "paused" | "crashed" | "out-of-fuel";

export interface RunState {
  status: RunStatus;
  stageId: string;
  vehicleId: string;
  vehicle: VehicleState;
  collectedIds: string[];
  coinsThisRun: number;
  distance: number;
}

export type RunEvent =
  | { type: "fuel-collected" }
  | { type: "coin-collected" }
  | { type: "airborne" }
  | { type: "landed" }
  | { type: "crashed" }
  | { type: "out-of-fuel" };

export interface RunStepResult {
  state: RunState;
  events: RunEvent[];
}
