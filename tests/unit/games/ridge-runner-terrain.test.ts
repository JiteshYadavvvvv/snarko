import { describe, expect, it } from "vitest";
import {
  DEFAULT_TERRAIN_CONFIG,
  generateCollectibles,
  generateTerrain,
  groundHeightAt,
} from "@/components/games/ridge-runner/engine/terrain";

describe("generateTerrain", () => {
  it("is deterministic for the same seed", () => {
    const a = generateTerrain(DEFAULT_TERRAIN_CONFIG);
    const b = generateTerrain(DEFAULT_TERRAIN_CONFIG);
    expect(a.heights).toEqual(b.heights);
  });

  it("produces a different profile for a different seed", () => {
    const a = generateTerrain(DEFAULT_TERRAIN_CONFIG);
    const b = generateTerrain({ ...DEFAULT_TERRAIN_CONFIG, seed: 7 });
    expect(a.heights).not.toEqual(b.heights);
  });

  it("keeps every height within the configured bounds", () => {
    const terrain = generateTerrain(DEFAULT_TERRAIN_CONFIG);
    for (const height of terrain.heights) {
      expect(height).toBeGreaterThanOrEqual(DEFAULT_TERRAIN_CONFIG.minHeight);
      expect(height).toBeLessThanOrEqual(DEFAULT_TERRAIN_CONFIG.maxHeight);
    }
  });

  it("produces the expected total length", () => {
    const terrain = generateTerrain(DEFAULT_TERRAIN_CONFIG);
    expect(terrain.length).toBe(
      DEFAULT_TERRAIN_CONFIG.segmentWidth *
        (DEFAULT_TERRAIN_CONFIG.segmentCount - 1),
    );
  });
});

describe("groundHeightAt", () => {
  const terrain = {
    segmentWidth: 100,
    heights: [200, 300, 200],
    length: 200,
  };

  it("returns the exact sample at a segment boundary", () => {
    expect(groundHeightAt(terrain, 0)).toBe(200);
    expect(groundHeightAt(terrain, 100)).toBe(300);
    expect(groundHeightAt(terrain, 200)).toBe(200);
  });

  it("linearly interpolates between samples", () => {
    expect(groundHeightAt(terrain, 50)).toBeCloseTo(250);
  });

  it("clamps x to the terrain bounds", () => {
    expect(groundHeightAt(terrain, -500)).toBe(200);
    expect(groundHeightAt(terrain, 5000)).toBe(200);
  });
});

describe("generateCollectibles", () => {
  it("is deterministic for the same seed", () => {
    const terrain = generateTerrain(DEFAULT_TERRAIN_CONFIG);
    const a = generateCollectibles(terrain, 42);
    const b = generateCollectibles(terrain, 42);
    expect(a).toEqual(b);
  });

  it("places every collectible within the terrain bounds with unique ids", () => {
    const terrain = generateTerrain(DEFAULT_TERRAIN_CONFIG);
    const collectibles = generateCollectibles(terrain, 42);
    expect(collectibles.length).toBeGreaterThan(0);
    const ids = new Set(collectibles.map((c) => c.id));
    expect(ids.size).toBe(collectibles.length);
    for (const collectible of collectibles) {
      expect(collectible.x).toBeGreaterThanOrEqual(0);
      expect(collectible.x).toBeLessThanOrEqual(terrain.length);
    }
  });
});
