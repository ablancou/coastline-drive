import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
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
const windowMat = new MeshStandardMaterial({
  color: 0x2a2410,
  emissive: 0xffd98a,
  emissiveIntensity: 1.4,
  roughness: 0.3,
});

/** A coastal city / marina skyline clustered along part of the inland side. */
export function buildBuildings(count = 18): Object3D {
  const root = new Group();
  const sign = getRoadInteriorSign();
  const frame = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };

  for (let i = 0; i < count; i++) {
    const t = 0.06 + hash01(i, 1.1) * 0.36; // a district, not the whole loop
    sampleRoadFrame(t, frame);
    const lateral = sign * (ROAD_WIDTH * 0.5 + 20 + hash01(i, 2.2) * 48);
    const x = frame.point.x + frame.side.x * lateral;
    const z = frame.point.z + frame.side.z * lateral;
    const y = cliffHeightAt(x, z);

    const w = 4 + hash01(i, 3.3) * 6;
    const d = 4 + hash01(i, 4.4) * 6;
    const h = 7 + hash01(i, 5.5) * 28;

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
    body.castShadow = true;
    body.receiveShadow = true;
    b.add(body);

    // A few lit windows on the front face.
    const rows = Math.min(8, Math.floor(h / 3));
    for (let r = 0; r < rows; r++) {
      for (let c = -1; c <= 1; c++) {
        if (hash01(i * 31 + r * 7 + c, 9.1) < 0.45) continue;
        const win = new Mesh(winGeo, windowMat);
        win.position.set(c * (w * 0.28), 1.5 + r * 3, d / 2 + 0.03);
        b.add(win);
      }
    }

    b.position.set(x, y, z);
    b.rotation.y = Math.atan2(frame.side.x * sign, frame.side.z * sign);
    root.add(b);
  }

  return root;
}
