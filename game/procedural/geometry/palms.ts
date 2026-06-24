import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
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
  const trunkMat = new MeshStandardMaterial({ color: 0x7a5a36, roughness: 0.9 });
  const frondMat = new MeshStandardMaterial({ color: 0x2f9d54, roughness: 0.65 });
  const coconutMat = new MeshStandardMaterial({ color: 0x4a3520, roughness: 0.8 });
  const trunkGeo = new CylinderGeometry(0.11, 0.22, 1, 8); // unit height; scaled per palm
  // Long, slim, drooping frond (flattened cone).
  const frondGeo = new ConeGeometry(0.26, 2.8, 4);
  const coconutGeo = new SphereGeometry(0.1, 8, 6);

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
    trunk.castShadow = false;
    palm.add(trunk);

    // Two tiers of drooping fronds for a fuller crown.
    const tiers = [
      { count: 6, droop: 0.2, reach: 1.05, y: h - 0.05 },
      { count: 6, droop: 0.6, reach: 0.95, y: h - 0.22 },
    ];
    for (let tIdx = 0; tIdx < tiers.length; tIdx++) {
      const tier = tiers[tIdx]!;
      for (let k = 0; k < tier.count; k++) {
        const holder = new Group();
        holder.rotation.y =
          (k / tier.count) * Math.PI * 2 + hash01(i, 6.1) + tIdx * 0.5;
        holder.position.y = tier.y;
        const frond = new Mesh(frondGeo, frondMat);
        frond.rotation.x = Math.PI / 2 + tier.droop; // outward + droop
        frond.position.z = tier.reach;
        frond.scale.set(1, 1, 0.25); // flatten into a leaf
        frond.castShadow = false;
        holder.add(frond);
        palm.add(holder);
      }
    }

    // Coconut cluster under the crown.
    for (let c = 0; c < 3; c++) {
      const nut = new Mesh(coconutGeo, coconutMat);
      const a = (c / 3) * Math.PI * 2;
      nut.position.set(Math.cos(a) * 0.14, h - 0.3, Math.sin(a) * 0.14);
      palm.add(nut);
    }

    palm.position.set(x, groundY, z);
    palm.rotation.z = (hash01(i, 4.4) - 0.5) * 0.28; // slight lean
    root.add(palm);
  }

  return root;
}
