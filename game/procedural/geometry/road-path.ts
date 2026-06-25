import { CatmullRomCurve3, Vector3 } from "three";
import { DEFAULT_TRACK, type Track } from "@/game/constants/tracks";

export const ROAD_WIDTH = 12;
export const ROAD_SEGMENTS = 420;
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

/** Switch the active coastal road (resets the cached curve). */
export function setActiveTrack(track: Track): void {
  if (track.id === _activeTrack.id) return;
  _activeTrack = track;
  _cachedCurve = null;
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
  let bestT = 0;
  let bestDist = Infinity;

  // 480 samples keep the nearest-point search accurate on the larger circuit
  // (used by the kinematic vehicle's lateral clamp and terrain shaping).
  for (let i = 0; i < 480; i++) {
    const t = i / 480;
    curve.getPoint(t, _point);
    const dx = _point.x - x;
    const dz = _point.z - z;
    const dist = dx * dx + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestT = t;
    }
  }

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
  const curve = getRoadCurve();
  let bestT = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 480; i++) {
    const t = i / 480;
    curve.getPoint(t, _point);
    const dx = _point.x - x;
    const dz = _point.z - z;
    const dist = dx * dx + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestT = t;
    }
  }
  return bestT;
}

/**
 * +1 or -1: which `side` of the open coastal road is land/cliffs. The opposite
 * side is the sea. Fixed so the ocean stays on the same side the whole drive.
 * (Flip this sign if the sea ends up on the wrong side.)
 */
export function getRoadInteriorSign(): number {
  return 1;
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
