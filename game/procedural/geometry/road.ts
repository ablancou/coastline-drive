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

    // Uniform dark asphalt with a faint per-segment tonal drift (weathering).
    const v = 0.17 + (Math.floor(t * 90) % 2 === 0 ? 0.015 : 0);
    colors.push(v, v, v + 0.01, v, v, v + 0.01);
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

const _f0 = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };

/**
 * Road markings laid just above the asphalt: solid white edge lines on both
 * shoulders and a dashed white centre line. Built as flat quads following the
 * spline — crisp lines no texture can match. Uses its own bright material so
 * the lines read clearly (and catch a touch of bloom at dusk).
 */
export function createRoadMarkingsGeometry(): BufferGeometry {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const y = 0.05; // a hair above the road surface (road sits at ~0.02)
  const edge = ROAD_WIDTH * 0.5 - 0.55;

  const quad = (
    p: typeof _f0,
    n: typeof _f0,
    lateral: number,
    hw: number,
  ): void => {
    const base = vertices.length / 3;
    vertices.push(
      p.point.x + p.side.x * (lateral - hw), y, p.point.z + p.side.z * (lateral - hw),
      p.point.x + p.side.x * (lateral + hw), y, p.point.z + p.side.z * (lateral + hw),
      n.point.x + n.side.x * (lateral - hw), y, n.point.z + n.side.z * (lateral - hw),
      n.point.x + n.side.x * (lateral + hw), y, n.point.z + n.side.z * (lateral + hw),
    );
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  };

  for (let i = 0; i < ROAD_SEGMENTS; i++) {
    sampleRoadFrame(i / ROAD_SEGMENTS, _f0);
    const p = { point: _f0.point.clone(), tangent: _f0.tangent.clone(), side: _f0.side.clone() };
    sampleRoadFrame((i + 1) / ROAD_SEGMENTS, _f0);
    const n = { point: _f0.point.clone(), tangent: _f0.tangent.clone(), side: _f0.side.clone() };

    // Continuous edge lines both sides.
    quad(p, n, -edge, 0.11);
    quad(p, n, edge, 0.11);
    // Dashed centre line: on for ~half the pattern.
    if (Math.floor((i / ROAD_SEGMENTS) * 90) % 2 === 0) quad(p, n, 0, 0.1);
  }

  geometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export { getRoadCurve } from "@/game/procedural/geometry/road-path";