import type { StageDefinition } from "@/components/games/ridge-runner/engine/types";

export const DEFAULT_STAGE_ID = "countryside";

export const STAGES: StageDefinition[] = [
  {
    id: "countryside",
    name: "Countryside Hills",
    description:
      "Rolling green hills. Gentle at the start, steeper further out.",
    unlock: { type: "always" },
    terrainConfig: {
      seed: 20260117,
      segmentWidth: 70,
      segmentCount: 600,
      baselineY: 340,
      baseAmplitude: 55,
      baseFrequency: 0.0085,
      difficultyRamp: 1.4,
      minHeight: 140,
      maxHeight: 470,
    },
    palette: {
      skyTop: "#cfeefc",
      skyBottom: "#eef8fb",
      groundFill: "#3f7d4a",
      groundFarFill: "#86b98d",
      groundEdge: "#2f5f38",
      mountainFill: "#8fb0a8",
      mountainFarFill: "#bcd6d8",
    },
    finishDistance: 900,
    completionReward: 60,
  },
  {
    id: "dusk-ridge",
    name: "Dusk Ridge",
    description:
      "Steeper badlands under an evening sky. Unlocks after 800m on Countryside Hills.",
    unlock: { type: "stage-distance", stageId: "countryside", distance: 800 },
    terrainConfig: {
      seed: 20260211,
      segmentWidth: 70,
      segmentCount: 650,
      baselineY: 330,
      baseAmplitude: 70,
      baseFrequency: 0.0095,
      difficultyRamp: 1.6,
      minHeight: 120,
      maxHeight: 480,
    },
    palette: {
      skyTop: "#f7c59f",
      skyBottom: "#6b4a8a",
      groundFill: "#7d5a3f",
      groundFarFill: "#b99169",
      groundEdge: "#5f3f2f",
      mountainFill: "#6b4a6f",
      mountainFarFill: "#8a6a94",
    },
    finishDistance: 1000,
    completionReward: 90,
  },
  {
    id: "frostline",
    name: "Frostline Pass",
    description:
      "Sharp, icy terrain with the tightest bumps. Unlocks after 800m on Dusk Ridge.",
    unlock: { type: "stage-distance", stageId: "dusk-ridge", distance: 800 },
    terrainConfig: {
      seed: 20260305,
      segmentWidth: 68,
      segmentCount: 700,
      baselineY: 330,
      baseAmplitude: 80,
      baseFrequency: 0.0105,
      difficultyRamp: 1.8,
      minHeight: 110,
      maxHeight: 490,
    },
    palette: {
      skyTop: "#dff3f7",
      skyBottom: "#f5fbfd",
      groundFill: "#7d94a0",
      groundFarFill: "#b8c9d1",
      groundEdge: "#5f7580",
      mountainFill: "#9fb8c4",
      mountainFarFill: "#c9dce3",
    },
    finishDistance: 1100,
    completionReward: 130,
  },
];

export function getStageDefinition(id: string): StageDefinition {
  const stage = STAGES.find((candidate) => candidate.id === id);
  return stage ?? STAGES[0];
}

export function isStageUnlocked(
  stage: StageDefinition,
  stageBestDistance: Record<string, number>,
): boolean {
  if (stage.unlock.type === "always") {
    return true;
  }
  return (
    (stageBestDistance[stage.unlock.stageId] ?? 0) >= stage.unlock.distance
  );
}

export function getNextStage(stageId: string): StageDefinition | undefined {
  const index = STAGES.findIndex((candidate) => candidate.id === stageId);
  if (index === -1) {
    return undefined;
  }
  return STAGES[index + 1];
}
