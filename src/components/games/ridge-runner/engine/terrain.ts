import type {
  CollectiblePlacement,
  Terrain,
  TerrainConfig,
} from "@/components/games/ridge-runner/engine/types";

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  seed: 20260117,
  segmentWidth: 70,
  segmentCount: 600,
  baselineY: 340,
  baseAmplitude: 55,
  baseFrequency: 0.0085,
  difficultyRamp: 1.4,
  minHeight: 140,
  maxHeight: 470,
};

function createRng(seed: number): () => number {
  let state = seed | 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateTerrain(config: TerrainConfig): Terrain {
  const rng = createRng(config.seed);
  const phaseA = rng() * Math.PI * 2;
  const phaseB = rng() * Math.PI * 2;
  const phaseC = rng() * Math.PI * 2;
  const length = config.segmentWidth * (config.segmentCount - 1);

  const heights: number[] = [];
  for (let i = 0; i < config.segmentCount; i += 1) {
    const x = i * config.segmentWidth;
    const progress = length > 0 ? x / length : 0;
    const amplitude =
      config.baseAmplitude * (1 + config.difficultyRamp * progress);
    const value =
      config.baselineY +
      amplitude * 0.6 * Math.sin(x * config.baseFrequency + phaseA) +
      amplitude * 0.3 * Math.sin(x * config.baseFrequency * 2.3 + phaseB) +
      amplitude * 0.15 * Math.sin(x * config.baseFrequency * 4.7 + phaseC);
    heights.push(clamp(value, config.minHeight, config.maxHeight));
  }

  return { segmentWidth: config.segmentWidth, heights, length };
}

export function groundHeightAt(terrain: Terrain, x: number): number {
  const clampedX = clamp(x, 0, terrain.length);
  const rawIndex = clampedX / terrain.segmentWidth;
  const index = Math.min(
    terrain.heights.length - 2,
    Math.max(0, Math.floor(rawIndex)),
  );
  const fraction = rawIndex - index;
  const a = terrain.heights[index];
  const b = terrain.heights[index + 1];
  return a + (b - a) * fraction;
}

export function generateCollectibles(
  terrain: Terrain,
  seed: number,
): CollectiblePlacement[] {
  const rng = createRng(seed);
  const collectibles: CollectiblePlacement[] = [];
  let x = 420;
  let index = 0;

  while (x < terrain.length - 400) {
    const kind = rng() < 0.32 ? "fuel" : "coin";
    const groundY = groundHeightAt(terrain, x);
    collectibles.push({
      id: `collectible-${index}`,
      kind,
      x,
      y: groundY - 52,
    });
    x += 380 + rng() * 340;
    index += 1;
  }

  return collectibles;
}
