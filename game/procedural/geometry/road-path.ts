import { CatmullRomCurve3, Vector3 } from "three";

export const ROAD_WIDTH = 12;
export const ROAD_SEGMENTS = 420;
/** Guardrails live on the exterior (ocean) edge of the loop. */
export const ROAD_OCEAN_SIDE = -1;
/** Cliffs rise on the interior of the loop. */
export const ROAD_CLIFF_SIDE = 1;

/**
 * Closed coastal circuit — a large stadium-style loop with two long straights
 * (east + west) and sweeping ends, so a lap takes much longer and mixes flat-out
 * straights with curves. Interior = central cliffs, exterior = ocean. The loop
 * can never end and the lateral clamp keeps the car off the sea.
 */
const ROAD_POINTS: Vector3[] = [
  // East long straight (south → north)
  new Vector3(120, 0.02, -170),
  new Vector3(120, 0.02, -60),
  new Vector3(120, 0.02, 60),
  new Vector3(120, 0.02, 160),
  // North sweep (east → west)
  new Vector3(80, 0.02, 205),
  new Vector3(0, 0.02, 215),
  new Vector3(-80, 0.02, 205),
  // West long straight (north → south)
  new Vector3(-120, 0.02, 160),
  new Vector3(-120, 0.02, 60),
  new Vector3(-120, 0.02, -60),
  new Vector3(-120, 0.02, -170),
  // South sweep (west → east) with a gentle kink for character
  new Vector3(-80, 0.02, -210),
  new Vector3(-10, 0.02, -218),
  new Vector3(70, 0.02, -205),
];

const _point = new Vector3();
const _tangent = new Vector3();
const _side = new Vector3();
const _up = new Vector3(0, 1, 0);

let _cachedCurve: CatmullRomCurve3 | null = null;
let _interiorSign = 0;

export function getRoadCurve(): CatmullRomCurve3 {
  if (!_cachedCurve) {
    _cachedCurve = new CatmullRomCurve3(ROAD_POINTS, true, "catmullrom", 0.5);
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

/**
 * +1 or -1: the world-space sign of the road `side` vector that points toward
 * the loop interior (where cliffs rise). Computed once from the loop centroid.
 */
export function getRoadInteriorSign(): number {
  if (_interiorSign !== 0) return _interiorSign;

  const curve = getRoadCurve();
  let cx = 0;
  let cz = 0;
  const samples = 64;
  for (let i = 0; i < samples; i++) {
    curve.getPoint(i / samples, _point);
    cx += _point.x;
    cz += _point.z;
  }
  cx /= samples;
  cz /= samples;

  curve.getPoint(0, _point);
  curve.getTangent(0, _tangent).normalize();
  _side.crossVectors(_up, _tangent).normalize();
  const lateralOfCentroid = (cx - _point.x) * _side.x + (cz - _point.z) * _side.z;
  _interiorSign = lateralOfCentroid >= 0 ? 1 : -1;
  return _interiorSign;
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
