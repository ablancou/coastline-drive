import {
  DodecahedronGeometry,
  Euler,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import {
  getRoadInteriorSign,
  ROAD_WIDTH,
  sampleRoadFrame,
} from "@/game/procedural/geometry/road-path";
import { cliffHeightAt } from "@/game/procedural/geometry/terrain";

const ROCK_COUNT = 180;
const _mat = new Matrix4();
const _quat = new Quaternion();
const _euler = new Euler();
const _scale = new Vector3();
const _pos = new Vector3();

const frame = {
  point: new Vector3(),
  tangent: new Vector3(),
  side: new Vector3(),
};

/** Deterministic pseudo-random from index — init-time only. */
function hash01(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export interface CliffRockInstances {
  geometry: DodecahedronGeometry;
  count: number;
  matrices: Float32Array;
}

/** Scattered rock outcrops on the inland cliff side of the highway. */
export function buildCliffRockInstances(): CliffRockInstances {
  const matrices = new Float32Array(ROCK_COUNT * 16);

  for (let i = 0; i < ROCK_COUNT; i++) {
    const t = hash01(i, 1.7);
    const lateralJitter = hash01(i, 4.2) * 14 + 4;
    // Scatter rocks on the interior (cliff) side of the loop.
    const lateralSign = getRoadInteriorSign();
    const lateral = lateralSign * (ROAD_WIDTH * 0.5 + lateralJitter);

    sampleRoadFrame(t, frame);

    const x = frame.point.x + frame.side.x * lateral;
    const z = frame.point.z + frame.side.z * lateral;
    const y = cliffHeightAt(x, z) + hash01(i, 9.1) * 1.2;

    const scale =
      0.35 + hash01(i, 2.3) * 1.4 + hash01(i, 6.6) * hash01(i, 3.1) * 2.2;

    _pos.set(x, y, z);
    _euler.set(
      hash01(i, 5.5) * 0.6,
      hash01(i, 7.7) * Math.PI * 2,
      hash01(i, 1.1) * 0.5,
    );
    _quat.setFromEuler(_euler);
    _scale.set(
      scale * (0.8 + hash01(i, 8.2) * 0.5),
      scale * (0.6 + hash01(i, 3.9) * 0.8),
      scale * (0.9 + hash01(i, 2.8) * 0.4),
    );

    _mat.compose(_pos, _quat, _scale);
    _mat.toArray(matrices, i * 16);
  }

  return {
    geometry: new DodecahedronGeometry(1, 0),
    count: ROCK_COUNT,
    matrices,
  };
}