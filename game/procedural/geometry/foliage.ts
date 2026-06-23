import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  Vector3,
} from "three";
import type { Biome } from "@/game/constants/biomes";
import { buildPalms } from "@/game/procedural/geometry/palms";
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

const cactusMat = new MeshStandardMaterial({ color: 0x4a7a4a, roughness: 0.85 });
const cypressMat = new MeshStandardMaterial({ color: 0x274d2c, roughness: 0.8 });
const trunkMat = new MeshStandardMaterial({ color: 0x5a4530, roughness: 0.9 });

/** Saguaro-style cactus. */
function createCactus(h: number): Object3D {
  const g = new Group();
  const body = new Mesh(new CylinderGeometry(0.28, 0.34, h, 8), cactusMat);
  body.position.y = h / 2;
  body.castShadow = true;
  g.add(body);
  for (const side of [-1, 1]) {
    if (hash01(h * 10, side) < 0.5) continue;
    const arm = new Mesh(new CylinderGeometry(0.16, 0.18, h * 0.5, 6), cactusMat);
    arm.position.set(side * 0.4, h * 0.55, 0);
    arm.rotation.z = side * 0.5;
    g.add(arm);
    const tip = new Mesh(new CylinderGeometry(0.16, 0.16, h * 0.3, 6), cactusMat);
    tip.position.set(side * 0.55, h * 0.78, 0);
    g.add(tip);
  }
  return g;
}

/** Tall cypress. */
function createCypress(h: number): Object3D {
  const g = new Group();
  const trunk = new Mesh(new CylinderGeometry(0.1, 0.14, h * 0.3, 6), trunkMat);
  trunk.position.y = h * 0.15;
  g.add(trunk);
  const top = new Mesh(new ConeGeometry(h * 0.22, h * 0.85, 8), cypressMat);
  top.position.y = h * 0.6;
  top.castShadow = true;
  g.add(top);
  return g;
}

/** Scatter biome-appropriate plants on the land side of the circuit. */
export function buildFoliage(biome: Biome): Object3D {
  if (biome.id === "tropical") return buildPalms(biome.palms);

  const root = new Group();
  const sign = getRoadInteriorSign();
  const frame = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };
  const arid = biome.id === "arid";
  const count = arid ? 26 : 30;

  for (let i = 0; i < count; i++) {
    const t = hash01(i, 1.1);
    sampleRoadFrame(t, frame);
    const lateral = sign * (ROAD_WIDTH * 0.5 + 7 + hash01(i, 2.2) * 26);
    const x = frame.point.x + frame.side.x * lateral;
    const z = frame.point.z + frame.side.z * lateral;
    const y = cliffHeightAt(x, z);
    const r = hash01(i, 3.3);

    let plant: Object3D;
    if (arid) {
      plant = r < 0.75 ? createCactus(2 + hash01(i, 4.4) * 2) : createPalmStub(i);
    } else {
      plant = r < 0.65 ? createCypress(4 + hash01(i, 4.4) * 3) : createPalmStub(i);
    }
    plant.position.set(x, y, z);
    plant.rotation.y = hash01(i, 5.5) * Math.PI * 2;
    root.add(plant);
  }
  return root;
}

/** A single small palm (for mediterranean/arid accents). */
function createPalmStub(i: number): Object3D {
  const g = new Group();
  const h = 3 + hash01(i, 6.6) * 1.5;
  const trunk = new Mesh(new CylinderGeometry(0.12, 0.2, h, 7), trunkMat);
  trunk.position.y = h / 2;
  trunk.castShadow = true;
  g.add(trunk);
  const frondMat = new MeshStandardMaterial({ color: 0x2f9d54, roughness: 0.7 });
  const frondGeo = new ConeGeometry(0.26, 2.4, 4);
  for (let k = 0; k < 6; k++) {
    const holder = new Group();
    holder.rotation.y = (k / 6) * Math.PI * 2;
    holder.position.y = h - 0.1;
    const frond = new Mesh(frondGeo, frondMat);
    frond.rotation.x = Math.PI / 2 + 0.4;
    frond.position.z = 0.95;
    frond.scale.set(1, 1, 0.25);
    holder.add(frond);
    g.add(holder);
  }
  return g;
}
