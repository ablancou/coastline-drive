import { BufferAttribute, BufferGeometry, Vector3 } from "three";
import {
  ROAD_SEGMENTS,
  ROAD_WIDTH,
  sampleRoadFrame,
} from "@/game/procedural/geometry/road-path";

const frame = {
  point: new Vector3(),
  tangent: new Vector3(),
  side: new Vector3(),
};

/** Spline-extruded coastal highway — 100% procedural, no external meshes. */
export function createRoadGeometry(): BufferGeometry {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const halfWidth = ROAD_WIDTH * 0.5;

  for (let i = 0; i <= ROAD_SEGMENTS; i++) {
    const t = i / ROAD_SEGMENTS;
    sampleRoadFrame(t, frame);

    const leftX = frame.point.x - frame.side.x * halfWidth;
    const leftY = frame.point.y;
    const leftZ = frame.point.z - frame.side.z * halfWidth;
    const rightX = frame.point.x + frame.side.x * halfWidth;
    const rightY = frame.point.y;
    const rightZ = frame.point.z + frame.side.z * halfWidth;

    vertices.push(leftX, leftY, leftZ, rightX, rightY, rightZ);
    normals.push(0, 1, 0, 0, 1, 0);

    const stripe = Math.floor(t * 40) % 2 === 0 ? 0.95 : 0.75;
    colors.push(0.18, 0.18, 0.2, stripe, stripe, stripe);
  }

  for (let i = 0; i < ROAD_SEGMENTS; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  geometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export { getRoadCurve } from "@/game/procedural/geometry/road-path";