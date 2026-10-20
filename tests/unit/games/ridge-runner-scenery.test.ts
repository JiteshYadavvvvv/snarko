import { describe, expect, it } from "vitest";
import { generateSceneryProps } from "@/components/games/ridge-runner/engine/scenery";
import { generateTerrain } from "@/components/games/ridge-runner/engine/terrain";
import {
  DEFAULT_STAGE_ID,
  STAGES,
} from "@/components/games/ridge-runner/engine/stages";

const stage = STAGES.find((candidate) => candidate.id === DEFAULT_STAGE_ID)!;
const terrain = generateTerrain(stage.terrainConfig);

describe("generateSceneryProps", () => {
  it("is deterministic for the same seed", () => {
    const a = generateSceneryProps(terrain, 7);
    const b = generateSceneryProps(terrain, 7);
    expect(a).toEqual(b);
  });

  it("places every prop within the terrain bounds with unique ids", () => {
    const props = generateSceneryProps(terrain, 7);
    expect(props.length).toBeGreaterThan(0);
    const ids = new Set(props.map((p) => p.id));
    expect(ids.size).toBe(props.length);
    for (const prop of props) {
      expect(prop.x).toBeGreaterThanOrEqual(0);
      expect(prop.x).toBeLessThanOrEqual(terrain.length);
    }
  });

  it("positions each prop at the terrain's own ground height", () => {
    const props = generateSceneryProps(terrain, 7);
    for (const prop of props) {
      expect(prop.groundY).toBeGreaterThanOrEqual(
        stage.terrainConfig.minHeight,
      );
      expect(prop.groundY).toBeLessThanOrEqual(stage.terrainConfig.maxHeight);
    }
  });
});
