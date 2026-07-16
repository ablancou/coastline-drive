import { CatmullRomCurve3, Vector3 } from "three";
import { DEFAULT_TRACK, type Track } from "@/game/constants/tracks";

export const ROAD_WIDTH = 12;
export const ROAD_SEGMENTS = 900;
/** Road surface height (all track points sit at this y). */
export const ROAD_SURFACE_Y = 0.02;
/** Guardrails live on the exterior (ocean) edge of the loop. */
export const ROAD_OCEAN_SIDE = -1;
/** Cliffs rise on the interior of the loop. */
export const ROAD_CLIFF_SIDE = 1;

const _point = new Vector3();
const _tangent = new Vector3();
const _side = new Vector3();
const _up = new Vector3(0, 1, 0);

let _activeTrack: Track = DEFAULT_TRACK;
let _cachedCurve: CatmullRomCurve3 | null = null;
let _cachedCoast: CatmullRomCurve3 | null = null;
let _roadLUT: Float32Array | null = null;
let _coastLUT: Float32Array | null = null;

/** Switch the active coastal road (resets the cached road + coastline curves). */
export function setActiveTrack(track: Track): void {
  if (track.id === _activeTrack.id) return;
  _activeTrack = track;
  _cachedCurve = null;
  _cachedCoast = null;
  _roadLUT = null;
  _coastLUT = null;
}

export function getActiveTrack(): Track {
  return _activeTrack;
}

export function getRoadCurve(): CatmullRomCurve3 {
  if (!_cachedCurve) {
    const pts = _activeTrack.points.map(([x, z]) => new Vector3(x, ROAD_SURFACE_Y, z));
    // Open coastal road (point-to-point), not a closed loop.
    _cachedCurve = new CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  }
  return _cachedCurve;
}

/** Fixed shoreline spline (land/sea boundary) for the active location. */
export function getCoastCurve(): CatmullRomCurve3 {
  if (!_cachedCoast) {
    const pts = _activeTrack.coast.map(([x, z]) => new Vector3(x, ROAD_SURFACE_Y, z));
    _cachedCoast = new CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  }
  return _cachedCoast;
}

const _coastPoint = new Vector3();
const _coastTangent = new Vector3();
const _coastSide = new Vector3();

// ---------------------------------------------------------------------------
// Nearest-point lookup tables. Sampling the CatmullRom spline is expensive
// (~640 getPoint calls per query on the old linear search — every physics step
// AND every terrain vertex at build time). Instead we bake each curve once into
// a flat XZ table, scan that with cheap array math, then refine by projecting
// onto the two neighbouring polyline segments for a CONTINUOUS t (no
// quantisation). Result: ~10× faster queries and a much shorter scene-build
// hitch, with better accuracy than the sampled search.
// ---------------------------------------------------------------------------
const ROAD_LUT_N = 1024;
const COAST_LUT_N = 768;

function buildLUT(curve: CatmullRomCurve3, n: number): Float32Array {
  const lut = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    curve.getPoint(i / (n - 1), _point);
    lut[i * 2] = _point.x;
    lut[i * 2 + 1] = _point.z;
  }
  return lut;
}

function getRoadLUT(): Float32Array {
  if (!_roadLUT) _roadLUT = buildLUT(getRoadCurve(), ROAD_LUT_N);
  return _roadLUT;
}

function getCoastLUT(): Float32Array {
  if (!_coastLUT) _coastLUT = buildLUT(getCoastCurve(), COAST_LUT_N);
  return _coastLUT;
}

/** Continuous curve parameter t (0..1) of the nearest point on a baked LUT. */
function nearestTOnLUT(lut: Float32Array, n: number, x: number, z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < n; i++) {
    const dx = lut[i * 2]! - x;
    const dz = lut[i * 2 + 1]! - z;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }

  // Refine: project onto the segments flanking the best sample.
  let bestT = best / (n - 1);
  const ax = lut[best * 2]!;
  const az = lut[best * 2 + 1]!;
  for (const j of [best - 1, best + 1]) {
    if (j < 0 || j >= n) continue;
    const bx = lut[j * 2]!;
    const bz = lut[j * 2 + 1]!;
    const abx = bx - ax;
    const abz = bz - az;
    const len2 = abx * abx + abz * abz;
    if (len2 < 1e-9) continue;
    let u = ((x - ax) * abx + (z - az) * abz) / len2;
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    const px = ax + abx * u;
    const pz = az + abz * u;
    const dx = px - x;
    const dz = pz - z;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      bestT = (best + (j - best) * u) / (n - 1);
    }
  }
  return bestT;
}

/**
 * Signed distance from the FIXED coastline at world XZ.
 * Positive = inland (land/cliffs), negative = out to sea. Terrain, beach and
 * ocean are shaped from this so the sea stays geographically put while the road
 * is free to veer inland (into the city) and back to the seafront.
 */
export function signedDistanceToCoast(x: number, z: number): number {
  const curve = getCoastCurve();
  const bestT = nearestTOnLUT(getCoastLUT(), COAST_LUT_N, x, z);
  curve.getPoint(bestT, _coastPoint);
  curve.getTangent(bestT, _coastTangent).normalize();
  _coastSide.crossVectors(_up, _coastTangent).normalize();
  const lateral =
    (x - _coastPoint.x) * _coastSide.x + (z - _coastPoint.z) * _coastSide.z;
  // seaXdir is the world-X side the sea lies on; land is the opposite side.
  return -_activeTrack.seaXdir * lateral;
}

export interface RoadFrame {
  point: Vector3;
  tangent: Vector3;
  side: Vector3;
}

export interface RoadSurfaceSample {
  y: number;
  tangent: Vector3;
  point: Vector3;
  /** Lateral (right-hand) unit vector across the road at this point. */
  side: Vector3;
}

/** Sample position + orientation frame along the coastal spline. */
export function sampleRoadFrame(t: number, out: RoadFrame): RoadFrame {
  const curve = getRoadCurve();
  curve.getPoint(t, out.point);
  curve.getTangent(t, out.tangent).normalize();
  out.side.crossVectors(_up, out.tangent).normalize();
  return out;
}

/** Closest road-surface sample at world XZ (analytic — no physics raycast). */
export function getRoadSurfaceAt(x: number, z: number, out: RoadSurfaceSample): RoadSurfaceSample {
  const curve = getRoadCurve();
  const bestT = nearestTOnLUT(getRoadLUT(), ROAD_LUT_N, x, z);
  curve.getPoint(bestT, out.point);
  curve.getTangent(bestT, out.tangent).normalize();
  out.side.crossVectors(_up, out.tangent).normalize();
  out.y = out.point.y;
  return out;
}

const _surfaceScratch: RoadSurfaceSample = {
  y: 0,
  tangent: _tangent,
  point: _point,
  side: _side,
};

export function getRoadSurfaceY(x: number, z: number): number {
  getRoadSurfaceAt(x, z, _surfaceScratch);
  return _surfaceScratch.point.y;
}

/** Normalized progress (0..1) of the nearest point on the circuit at world XZ. */
export function getRoadProgress(x: number, z: number): number {
  return nearestTOnLUT(getRoadLUT(), ROAD_LUT_N, x, z);
}

/**
 * +1 or -1: which `side` of the open coastal road is land/cliffs. The opposite
 * side is the sea. Fixed so the ocean stays on the same side the whole drive.
 * (Flip this sign if the sea ends up on the wrong side.)
 */
export function getRoadInteriorSign(): number {
  // The road's land side, relative to its right-hand `side` vector. Sea sits on
  // the opposite side. Per-location so each destination's sea is on the side the
  // user expects (e.g. Acapulco sea-right, Mónaco sea-left / city-right).
  return -_activeTrack.seaXdir;
}

const _lateralScratch: RoadSurfaceSample = {
  y: 0,
  tangent: new Vector3(),
  point: new Vector3(),
  side: new Vector3(),
};

/**
 * Signed distance from the road centerline at world XZ.
 * Positive = toward the loop interior (cliffs), negative = exterior (ocean).
 */
export function getLateralOffsetFromRoad(x: number, z: number): number {
  getRoadSurfaceAt(x, z, _lateralScratch);
  const lateral =
    (x - _lateralScratch.point.x) * _lateralScratch.side.x +
    (z - _lateralScratch.point.z) * _lateralScratch.side.z;
  return lateral * getRoadInteriorSign();
}
