import { BufferAttribute, BufferGeometry, Vector3 } from "three";
import {
  getActiveTrack,
  getCoastCurve,
} from "@/game/procedural/geometry/road-path";

const _p = new Vector3();
const _tan = new Vector3();
const _side = new Vector3();
const UP = new Vector3(0, 1, 0);

/**
 * A ribbon of surf hugging the shoreline: a strip between two seaward offsets
 * from the coast curve at a fixed height just above the ocean plane. The waves
 * periodically wash over it, which reads as breaking surf.
 */
export function createShoreFoamGeometry(
  offsetNear: number,
  offsetFar: number,
  y: number,
  segments = 180,
): BufferGeometry {
  const curve = getCoastCurve();
  const seaXdir = getActiveTrack().seaXdir;

  const positions = new Float32Array((segments + 1) * 2 * 3);
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    // Keep a hair away from the open ends of the spline.
    const t = 0.01 + (0.98 * i) / segments;
    curve.getPoint(t, _p);
    curve.getTangent(t, _tan).normalize();
    _side.crossVectors(UP, _tan).normalize();
    const dirX = _side.x * seaXdir;
    const dirZ = _side.z * seaXdir;

    const base = i * 6;
    positions[base] = _p.x + dirX * offsetNear;
    positions[base + 1] = y;
    positions[base + 2] = _p.z + dirZ * offsetNear;
    positions[base + 3] = _p.x + dirX * offsetFar;
    positions[base + 4] = y;
    positions[base + 5] = _p.z + dirZ * offsetFar;

    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
