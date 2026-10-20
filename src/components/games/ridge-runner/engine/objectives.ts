import type { ObjectiveDefinition } from "@/components/games/ridge-runner/engine/types";

export const OBJECTIVES: ObjectiveDefinition[] = [
  {
    id: "countryside-travel-500",
    stageId: "countryside",
    label: "Travel 500m in one run",
    reward: 15,
    isComplete: (result) =>
      result.stageId === "countryside" && result.distance >= 500,
  },
  {
    id: "countryside-coins-3",
    stageId: "countryside",
    label: "Collect 3 coins in one run",
    reward: 15,
    isComplete: (result) =>
      result.stageId === "countryside" && result.coinsThisRun >= 3,
  },
  {
    id: "dusk-ridge-travel-700",
    stageId: "dusk-ridge",
    label: "Travel 700m in one run",
    reward: 25,
    isComplete: (result) =>
      result.stageId === "dusk-ridge" && result.distance >= 700,
  },
  {
    id: "dusk-ridge-coins-4",
    stageId: "dusk-ridge",
    label: "Collect 4 coins in one run",
    reward: 25,
    isComplete: (result) =>
      result.stageId === "dusk-ridge" && result.coinsThisRun >= 4,
  },
  {
    id: "frostline-travel-900",
    stageId: "frostline",
    label: "Travel 900m in one run",
    reward: 40,
    isComplete: (result) =>
      result.stageId === "frostline" && result.distance >= 900,
  },
  {
    id: "frostline-coins-5",
    stageId: "frostline",
    label: "Collect 5 coins in one run",
    reward: 40,
    isComplete: (result) =>
      result.stageId === "frostline" && result.coinsThisRun >= 5,
  },
];

export function getObjectivesForStage(stageId: string): ObjectiveDefinition[] {
  return OBJECTIVES.filter((objective) => objective.stageId === stageId);
}
