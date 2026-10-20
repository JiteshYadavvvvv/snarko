import {
  createRng,
  groundHeightAt,
} from "@/components/games/ridge-runner/engine/terrain";
import type { Terrain } from "@/components/games/ridge-runner/engine/types";

export type SceneryVariant = 0 | 1 | 2;

export interface SceneryProp {
  id: string;
  x: number;
  groundY: number;
  variant: SceneryVariant;
  scale: number;
}

function pickVariant(sample: number): SceneryVariant {
  if (sample < 1 / 3) return 0;
  if (sample < 2 / 3) return 1;
  return 2;
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
      variant: pickVariant(rng()),
      scale: 0.8 + rng() * 0.6,
    });
    x += 90 + rng() * 150;
    index += 1;
  }

  return props;
}
