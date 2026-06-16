import {
  BoxGeometry,
  CylinderGeometry,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import {
  getRoadInteriorSign,
  ROAD_SEGMENTS,
  ROAD_WIDTH,
  sampleRoadFrame,
} from "@/game/procedural/geometry/road-path";

const POST_INTERVAL = 8;
const GUARDRAIL_EDGE_OFFSET = 0.55;
const POST_HEIGHT = 0.82;
const POST_RADIUS = 0.06;
const LOWER_RAIL_Y = 0.28;
const UPPER_RAIL_Y = 0.62;
const RAIL_THICKNESS = 0.05;
const X_AXIS = new Vector3(1, 0, 0);
const _postPos = new Vector3();

const frame = {
  point: new Vector3(),
  tangent: new Vector3(),
  side: new Vector3(),
};

const _pos = new Vector3();
const _mat = new Matrix4();
const _quat = new Quaternion();
const _scale = new Vector3();

export interface GuardrailMeshes {
  postGeometry: CylinderGeometry;
  railGeometry: BoxGeometry;
  postCount: number;
  railSegmentCount: number;
  postMatrices: Float32Array;
  lowerRailMatrices: Float32Array;
  upperRailMatrices: Float32Array;
}

/** Procedural guardrail instances along the ocean-side road edge. */
export function buildGuardrailMeshes(): GuardrailMeshes {
  const postCount = Math.floor(ROAD_SEGMENTS / POST_INTERVAL) + 1;
  const railSegmentCount = Math.max(0, postCount - 1);

  const postMatrices = new Float32Array(postCount * 16);
  const lowerRailMatrices = new Float32Array(railSegmentCount * 16);
  const upperRailMatrices = new Float32Array(railSegmentCount * 16);

  // Guardrails hug the exterior (ocean) edge of the loop.
  const lateral =
    -getRoadInteriorSign() * (ROAD_WIDTH * 0.5 + GUARDRAIL_EDGE_OFFSET);

  const postA = new Vector3();
  const postB = new Vector3();

  for (let i = 0; i < postCount; i++) {
    const t = Math.min(1, (i * POST_INTERVAL) / ROAD_SEGMENTS);
    sampleRoadFrame(t, frame);

    _pos.set(
      frame.point.x + frame.side.x * lateral,
      frame.point.y + 0.04,
      frame.point.z + frame.side.z * lateral,
    );

    if (i > 0) {
      buildRailMatrix(postA, _pos, LOWER_RAIL_Y, lowerRailMatrices, i - 1);
      buildRailMatrix(postA, _pos, UPPER_RAIL_Y, upperRailMatrices, i - 1);
    }

    _scale.set(1, POST_HEIGHT, 1);
    _postPos.set(_pos.x, _pos.y + POST_HEIGHT * 0.5, _pos.z);
    _mat.compose(_postPos, _quat.identity(), _scale);
    _mat.toArray(postMatrices, i * 16);

    postA.copy(_pos);
  }

  return {
    postGeometry: new CylinderGeometry(POST_RADIUS, POST_RADIUS, 1, 8),
    railGeometry: new BoxGeometry(1, RAIL_THICKNESS, RAIL_THICKNESS),
    postCount,
    railSegmentCount,
    postMatrices,
    lowerRailMatrices,
    upperRailMatrices,
  };
}

function buildRailMatrix(
  start: Vector3,
  end: Vector3,
  height: number,
  target: Float32Array,
  index: number,
): void {
  const mid = new Vector3(
    (start.x + end.x) * 0.5,
    (start.y + end.y) * 0.5 + height,
    (start.z + end.z) * 0.5,
  );

  const dir = new Vector3(end.x - start.x, 0, end.z - start.z);
  const length = dir.length();
  if (length < 0.01) return;

  dir.normalize();
  _quat.setFromUnitVectors(X_AXIS, dir);
  _scale.set(length, 1, 1);
  _mat.compose(mid, _quat, _scale);
  _mat.toArray(target, index * 16);
}