import { BufferAttribute, BufferGeometry, PlaneGeometry } from "three";
import {
  getLateralOffsetFromRoad,
  ROAD_WIDTH,
  signedDistanceToCoast,
} from "@/game/procedural/geometry/road-path";

/** Road spline surface height (ROAD_POINTS are at y = 0.02). */
const ROAD_SURFACE_Y = 0.02;
/** Flat corridor half-width (road + shoulder) kept below the asphalt. */
const ROAD_CORRIDOR_HALF = ROAD_WIDTH * 0.5 + 1.5;
/** Shoreline height — just above the ocean plane (y = -1.5) so the sea laps it. */
const WATER_BASE = -0.7;

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

/**
 * Natural terrain height from the FIXED coastline. `sd` is signed distance to
 * the shore (+ inland, − out to sea). The sea slopes down beneath the ocean
 * plane; near shore is a gentle beach/promenade; cliffs only rise as a distant
 * backdrop (far inland) so the road + city stay on plausible, drivable ground.
 */
export function naturalCoastHeight(sd: number, x: number, z: number): number {
  if (sd <= 0) return WATER_BASE + sd * 0.3; // seaward: descend under the water
  const cliffMask = Math.min(1, Math.max(0, (sd - 60) / 55));
  const cliff = cliffMask * cliffMask * 20;
  // Distant backdrop ridge — the "cerro" rising behind the hotel skyline.
  const ridgeMask = Math.min(1, Math.max(0, (sd - 115) / 85));
  const ridge = ridgeMask * ridgeMask * 26;
  const noise = fractalNoise(x, z) * (1.1 + cliffMask * 3.5 + ridgeMask * 2.5);
  return WATER_BASE + sd * 0.045 + cliff + ridge + noise;
}

/**
 * Final terrain height given the unsigned distance to the road (`absRoad`) and
 * the signed distance to the shore (`sd`). Carves a flat corridor under the road
 * wherever it runs (incl. inland city detours) so terrain never pokes through
 * the asphalt, then blends out to the coast-driven natural terrain.
 */
export function corridorBlendedHeight(
  absRoad: number,
  sd: number,
  x: number,
  z: number,
): number {
  const corridorFloor = ROAD_SURFACE_Y - 0.25;
  if (absRoad <= ROAD_CORRIDOR_HALF) return corridorFloor;
  const natural = naturalCoastHeight(sd, x, z);
  const k = Math.min(1, (absRoad - ROAD_CORRIDOR_HALF) / 14);
  const blend = k * k * (3 - 2 * k); // smoothstep
  return corridorFloor * (1 - blend) + natural * blend;
}

/** Shared height sampler for terrain mesh and cliff rocks. */
export function cliffHeightAt(x: number, z: number): number {
  return corridorBlendedHeight(
    Math.abs(getLateralOffsetFromRoad(x, z)),
    signedDistanceToCoast(x, z),
    x,
    z,
  );
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
    // Compute both distances once and reuse for height + colour (each is a
    // nearest-point search over a spline, so avoid doing them twice).
    const absRoad = Math.abs(getLateralOffsetFromRoad(x, z));
    const sd = signedDistanceToCoast(x, z);
    positions.setY(i, corridorBlendedHeight(absRoad, sd, x, z));

    // Colour by distance to the fixed shore: sand at the beach, grass inland,
    // rock on the far cliffs. Sea-side vertices read as wet sand through water.
    const G = biome.grass;
    const R = biome.rock;
    const S = biome.sand;

    let r: number;
    let g: number;
    let b: number;

    if (sd < 5) {
      // Beach / waterline band (and submerged sand seaward of the shore).
      r = S[0];
      g = S[1];
      b = S[2];
    } else {
      // Sand → grass over the first stretch inland.
      const t = Math.min(1, (sd - 5) / 14);
      r = S[0] + (G[0] - S[0]) * t;
      g = S[1] + (G[1] - S[1]) * t;
      b = S[2] + (G[2] - S[2]) * t;
    }
    if (sd > 50) {
      // Grass → rock as the distant cliffs climb.
      const t = Math.min(1, (sd - 50) / 40);
      r = G[0] + (R[0] - G[0]) * t + fractalNoise(x, z) * 0.05 * t;
      g = G[1] + (R[1] - G[1]) * t + fractalNoise(z, x) * 0.04 * t;
      b = G[2] + (R[2] - G[2]) * t;
    }

    // Break up the flat grass with broad meadow patches + dry/lush variation so
    // it doesn't read as a single green sheet. Low-frequency so it stays
    // coherent across the terrain's large triangles.
    const gw =
      Math.min(1, (sd - 5) / 16) *
      (1 - Math.min(1, Math.max(0, (sd - 46) / 40)));
    if (gw > 0.02) {
      const patch = fractalNoise(x * 0.13, z * 0.11);
      const fine = fractalNoise(x * 0.47 + 12, z * 0.5 - 7);
      const m = (patch * 0.62 + fine * 0.38) * 0.42; // ~ -0.9..0.9
      r += m * 0.03 * gw;
      g += m * 0.055 * gw;
      b += m * 0.018 * gw;
      // Sun-dried sandy patches where the meadow thins out.
      if (m < -0.42) {
        const d = (-m - 0.42) * gw;
        r += 0.1 * d;
        g += 0.05 * d;
        b -= 0.02 * d;
      }
    }

    colors[i * 3] = r < 0 ? 0 : r > 1 ? 1 : r;
    colors[i * 3 + 1] = g < 0 ? 0 : g > 1 ? 1 : g;
    colors[i * 3 + 2] = b < 0 ? 0 : b > 1 ? 1 : b;
  }

  positions.needsUpdate = true;
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}