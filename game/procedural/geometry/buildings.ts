import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  Quaternion,
  Vector3,
} from "three";
import {
  getRoadInteriorSign,
  ROAD_WIDTH,
  sampleRoadFrame,
} from "@/game/procedural/geometry/road-path";
import { cliffHeightAt } from "@/game/procedural/geometry/terrain";

function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CONCRETE = [0xd8d2c6, 0xc9cdd2, 0xe0d8c8, 0xbfc6cc, 0xd0c4b4];
const winGeo = new BoxGeometry(0.4, 0.4, 0.05);
const litWinMat = new MeshStandardMaterial({
  color: 0x2a2410,
  emissive: 0xffd98a,
  emissiveIntensity: 1.4,
  roughness: 0.3,
});
const darkWinMat = new MeshStandardMaterial({
  color: 0x1d2733,
  metalness: 0.4,
  roughness: 0.25,
});
const roofMat = new MeshStandardMaterial({ color: 0x8e8a80, roughness: 0.9 });
const acMat = new MeshStandardMaterial({ color: 0xaeb4ba, roughness: 0.7, metalness: 0.3 });

const _m = new Matrix4();
const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3(1, 1, 1);
const _axisY = new Vector3(0, 1, 0);
const _faceQ = new Quaternion();

/**
 * A coastal city skyline on the inland side: a dense front row of mid-rise
 * hotels near the road plus a taller second row behind them. Facades carry a
 * full window grid (front + both sides) as just TWO instanced draws — lit and
 * unlit glass — plus parapets, AC units and antennas on the roofline.
 */
export function buildBuildings(count = 34): Object3D {
  const root = new Group();
  const sign = getRoadInteriorSign();
  const frame = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };

  const litMatrices: Matrix4[] = [];
  const darkMatrices: Matrix4[] = [];

  /** Queue one window instance in a building's local frame → world matrix. */
  const pushWindow = (
    bPos: Vector3,
    bYaw: number,
    lx: number,
    ly: number,
    lz: number,
    faceYaw: number,
    lit: boolean,
  ): void => {
    _q.setFromAxisAngle(_axisY, bYaw);
    _p.set(lx, ly, lz).applyQuaternion(_q).add(bPos);
    _faceQ.setFromAxisAngle(_axisY, bYaw + faceYaw);
    _m.compose(_p, _faceQ, _s);
    (lit ? litMatrices : darkMatrices).push(_m.clone());
  };

  for (let i = 0; i < count; i++) {
    const backRow = i >= count * 0.55; // taller towers behind the front strip
    const t = 0.05 + hash01(i, 1.1) * 0.5; // a long resort district
    sampleRoadFrame(t, frame);
    const inland = backRow
      ? 52 + hash01(i, 2.2) * 42
      : 18 + hash01(i, 2.2) * 26;
    const lateral = sign * (ROAD_WIDTH * 0.5 + inland);
    const x = frame.point.x + frame.side.x * lateral;
    const z = frame.point.z + frame.side.z * lateral;
    const y = cliffHeightAt(x, z);

    const w = 4 + hash01(i, 3.3) * (backRow ? 8 : 6);
    const d = 4 + hash01(i, 4.4) * (backRow ? 8 : 6);
    const h = backRow ? 18 + hash01(i, 5.5) * 42 : 7 + hash01(i, 5.5) * 22;

    const b = new Group();
    const body = new Mesh(
      new BoxGeometry(w, h, d),
      new MeshStandardMaterial({
        color: CONCRETE[i % CONCRETE.length],
        roughness: 0.85,
        metalness: 0.05,
      }),
    );
    body.position.y = h / 2;
    body.castShadow = false;
    body.receiveShadow = true;
    b.add(body);

    // Roofline: parapet slab, AC unit, and an antenna on the tall towers.
    const parapet = new Mesh(new BoxGeometry(w + 0.3, 0.35, d + 0.3), roofMat);
    parapet.position.y = h + 0.12;
    b.add(parapet);
    if (hash01(i, 6.6) > 0.35) {
      const ac = new Mesh(new BoxGeometry(1.4, 0.9, 1.1), acMat);
      ac.position.set((hash01(i, 7.7) - 0.5) * w * 0.5, h + 0.75, (hash01(i, 8.8) - 0.5) * d * 0.5);
      b.add(ac);
    }
    if (backRow && h > 40) {
      const antenna = new Mesh(new CylinderGeometry(0.05, 0.08, 4.5, 6), acMat);
      antenna.position.y = h + 2.4;
      b.add(antenna);
    }

    const bPos = new Vector3(x, y, z);
    const bYaw = Math.atan2(frame.side.x * sign, frame.side.z * sign);
    b.position.copy(bPos);
    b.rotation.y = bYaw;
    root.add(b);

    // Window grids — front face + both sides. Lit ~45%, rest dark glass.
    const rows = Math.min(10, Math.floor(h / 3));
    for (let r = 0; r < rows; r++) {
      const wy = 1.5 + r * 3;
      // Front (+Z local).
      for (let c = -1; c <= 1; c++) {
        pushWindow(bPos, bYaw, c * (w * 0.28), wy, d / 2 + 0.03, 0, hash01(i * 31 + r * 7 + c, 9.1) >= 0.55);
      }
      // Sides (±X local) — two columns each.
      for (const sx of [-1, 1]) {
        for (let c = 0; c < 2; c++) {
          pushWindow(
            bPos,
            bYaw,
            sx * (w / 2 + 0.03),
            wy,
            (c - 0.5) * d * 0.45,
            sx * (Math.PI / 2),
            hash01(i * 47 + r * 11 + sx * 3 + c, 4.7) >= 0.6,
          );
        }
      }
    }
  }

  // Two draws for every window in the district.
  const lit = new InstancedMesh(winGeo, litWinMat, litMatrices.length);
  litMatrices.forEach((m, idx) => lit.setMatrixAt(idx, m));
  lit.instanceMatrix.needsUpdate = true;
  root.add(lit);

  const dark = new InstancedMesh(winGeo, darkWinMat, darkMatrices.length);
  darkMatrices.forEach((m, idx) => dark.setMatrixAt(idx, m));
  dark.instanceMatrix.needsUpdate = true;
  root.add(dark);

  return root;
}
