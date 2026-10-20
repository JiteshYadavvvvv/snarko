import { describe, expect, it } from "vitest";
import {
  STAGES,
  isStageUnlocked,
} from "@/components/games/ridge-runner/engine/stages";

describe("isStageUnlocked", () => {
  it("the first stage is always unlocked", () => {
    const first = STAGES[0];
    expect(isStageUnlocked(first, {})).toBe(true);
  });

  it("a distance-gated stage is locked until the requirement is met", () => {
    const second = STAGES[1];
    expect(second.unlock.type).toBe("stage-distance");
    if (second.unlock.type !== "stage-distance") return;

    expect(
      isStageUnlocked(second, {
        [second.unlock.stageId]: second.unlock.distance - 1,
      }),
    ).toBe(false);
    expect(
      isStageUnlocked(second, {
        [second.unlock.stageId]: second.unlock.distance,
      }),
    ).toBe(true);
  });

  it("every stage has a distinct id and terrain seed", () => {
    const ids = new Set(STAGES.map((s) => s.id));
    const seeds = new Set(STAGES.map((s) => s.terrainConfig.seed));
    expect(ids.size).toBe(STAGES.length);
    expect(seeds.size).toBe(STAGES.length);
  });
});
