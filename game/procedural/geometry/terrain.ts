import { BufferAttribute, BufferGeometry, PlaneGeometry } from "three";
import {
  getLateralOffsetFromRoad,
  ROAD_WIDTH,
} from "@/game/procedural/geometry/road-path";

/** Road spline surface height (ROAD_POINTS are at y = 0.02). */
const ROAD_SURFACE_Y = 0.02;
/** Flat corridor half-width (road + shoulder) kept below the asphalt. */
const ROAD_CORRIDOR_HALF = ROAD_WIDTH * 0.5 + 1.5;

function noise2D(x: number, z: number): number {
  return (
    Math.sin(x * 0.11) * Math.cos(z * 0.08) * 1.2 +
    Math.sin(x * 0.04 + z * 0.05) * 0.9 +
    Math.sin(x * 0.23 + z * 0.17) * 0.35
  );
}

function fractalNoise(x: number, z: number): number {
  return (
    noise2D(x, z) * 0.55 +
    noise2D(x * 2.1, z * 2.1) * 0.3 +
    noise2D(x * 4.4, z * 4.4) * 0.15
  );
}

/** Shared height sampler for terrain mesh and cliff rocks. */
export function cliffHeightAt(x: number, z: number): number {
  const lateral = getLateralOffsetFromRoad(x, z);
  const inland = Math.max(0, lateral - 5);
  const cliffMask = Math.min(1, inland / 18);
  const cliffSteepness = cliffMask * cliffMask * 12;
  const baseNoise = fractalNoise(x, z) * (2 + cliffMask * 4);
  const oceanShelf = Math.max(0, -lateral - 6) * 0.15;
  const natural = baseNoise + cliffSteepness - oceanShelf - 1.1;

  // Carve a flat corridor under the road so terrain never pokes through the
  // asphalt (prevents the green z-fighting patches). Sits just below road level
  // and smoothly blends into the natural terrain past the shoulder.
  const corridorFloor = ROAD_SURFACE_Y - 0.25;
  const absLat = Math.abs(lateral);
  if (absLat <= ROAD_CORRIDOR_HALF) return corridorFloor;

  const k = Math.min(1, (absLat - ROAD_CORRIDOR_HALF) / 6);
  const blend = k * k * (3 - 2 * k); // smoothstep
  return corridorFloor * (1 - blend) + natural * blend;
}

export interface TerrainBiome {
  grass: [number, number, number];
  rock: [number, number, number];
  sand: [number, number, number];
}

const DEFAULT_BIOME: TerrainBiome = {
  grass: [0.22, 0.46, 0.2],
  rock: [0.42, 0.4, 0.36],
  sand: [0.62, 0.56, 0.42],
};

/** Coastal cliff terrain — road-aware height + biome-tinted vertex colors. */
export function createTerrainGeometry(
  width = 340,
  depth = 560,
  segments = 150,
  biome: TerrainBiome = DEFAULT_BIOME,
): BufferGeometry {
  const geometry = new PlaneGeometry(width, depth, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  if (!positions) return geometry;

  const colors = new Float32Array(positions.count * 3);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = cliffHeightAt(x, z);
    positions.setY(i, height);

    const lateral = getLateralOffsetFromRoad(x, z);
    const inland = Math.max(0, lateral - 4);
    const G = biome.grass;
    const R = biome.rock;
    const S = biome.sand;

    let r = G[0];
    let g = G[1];
    let b = G[2];

    if (inland > 2) {
      const t = Math.min(1, (inland - 2) / 12); // grass → rock as it climbs
      r = G[0] + (R[0] - G[0]) * t;
      g = G[1] + (R[1] - G[1]) * t;
      b = G[2] + (R[2] - G[2]) * t;
    }
    if (inland > 10) {
      r = R[0] + fractalNoise(x, z) * 0.05;
      g = R[1] + fractalNoise(z, x) * 0.04;
      b = R[2];
    }
    if (lateral < -6) {
      r = S[0];
      g = S[1];
      b = S[2];
    }

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  positions.needsUpdate = true;
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}