import {
  createRng,
  groundHeightAt,
} from "@/components/games/ridge-runner/engine/terrain";
import type { Terrain } from "@/components/games/ridge-runner/engine/types";

export type SceneryVariant = 0 | 1;

export interface SceneryProp {
  id: string;
  x: number;
  groundY: number;
  variant: SceneryVariant;
  scale: number;
}

export function generateSceneryProps(
  terrain: Terrain,
  seed: number,
): SceneryProp[] {
  const rng = createRng(seed);
  const props: SceneryProp[] = [];
  let x = 60;
  let index = 0;

  while (x < terrain.length - 60) {
    props.push({
      id: `scenery-${index}`,
      x,
      groundY: groundHeightAt(terrain, x),
      variant: rng() < 0.5 ? 0 : 1,
      scale: 0.8 + rng() * 0.6,
    });
    x += 90 + rng() * 150;
    index += 1;
  }

  return props;
}
