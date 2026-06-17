import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
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

/** Scatter of procedural palm trees on the interior (land) side of the circuit. */
export function buildPalms(count = 34): Group {
  const root = new Group();
  const trunkMat = new MeshStandardMaterial({ color: 0x6b5031, roughness: 0.9 });
  const frondMat = new MeshStandardMaterial({ color: 0x2f7d4f, roughness: 0.7 });
  const trunkGeo = new CylinderGeometry(0.1, 0.2, 1, 7); // unit height; scaled per palm
  const frondGeo = new ConeGeometry(0.32, 2.0, 4);

  const frame = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };
  const sign = getRoadInteriorSign();

  for (let i = 0; i < count; i++) {
    const t = hash01(i, 1.1);
    sampleRoadFrame(t, frame);
    const lateral = sign * (ROAD_WIDTH * 0.5 + 7 + hash01(i, 2.2) * 26);
    const x = frame.point.x + frame.side.x * lateral;
    const z = frame.point.z + frame.side.z * lateral;
    const groundY = cliffHeightAt(x, z);
    const h = 3 + hash01(i, 3.3) * 2.6;

    const palm = new Group();

    const trunk = new Mesh(trunkGeo, trunkMat);
    trunk.scale.set(1, h, 1);
    trunk.position.y = h / 2;
    trunk.castShadow = true;
    palm.add(trunk);

    const crown = 7;
    for (let k = 0; k < crown; k++) {
      const holder = new Group();
      holder.rotation.y = (k / crown) * Math.PI * 2 + hash01(i, 6.1);
      holder.position.y = h - 0.15;
      const frond = new Mesh(frondGeo, frondMat);
      frond.rotation.x = Math.PI / 2 + 0.35; // splay outward + droop
      frond.position.z = 0.85;
      frond.scale.set(1, 1, 0.4);
      frond.castShadow = true;
      holder.add(frond);
      palm.add(holder);
    }

    palm.position.set(x, groundY, z);
    palm.rotation.z = (hash01(i, 4.4) - 0.5) * 0.28; // slight lean
    root.add(palm);
  }

  return root;
}
