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
let _cachedCoast: CatmullRomCurve3 | null = null;

/** Switch the active coastal road (resets the cached road + coastline curves). */
export function setActiveTrack(track: Track): void {
  if (track.id === _activeTrack.id) return;
  _activeTrack = track;
  _cachedCurve = null;
  _cachedCoast = null;
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

/**
 * Signed distance from the FIXED coastline at world XZ.
 * Positive = inland (land/cliffs), negative = out to sea. Terrain, beach and
 * ocean are shaped from this so the sea stays geographically put while the road
 * is free to veer inland (into the city) and back to the seafront.
 */
export function signedDistanceToCoast(x: number, z: number): number {
  const curve = getCoastCurve();
  let bestT = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 260; i++) {
    const t = i / 260;
    curve.getPoint(t, _coastPoint);
    const dx = _coastPoint.x - x;
    const dz = _coastPoint.z - z;
    const d = dx * dx + dz * dz;
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
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
