import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Shape,
  ShapeGeometry,
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

const PARASOL_COLORS = [0xe8503a, 0xf28e2b, 0x3a8de8, 0xf2c14e, 0x49b083, 0xe85d9c];
const SEA_LEVEL = -1.35;

/** Sailboats out on the lagoon + colorful parasols along the beach. */
export function buildCoastalProps(): Group {
  const root = new Group();
  const oceanSign = -getRoadInteriorSign(); // toward the water
  const frame = { point: new Vector3(), tangent: new Vector3(), side: new Vector3() };

  const hullMat = new MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 });
  const trimMat = new MeshStandardMaterial({ color: 0x223a55, roughness: 0.5 });
  const mastMat = new MeshStandardMaterial({ color: 0xcbb89a, roughness: 0.7 });
  const sailMat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: 2 });
  const poleMat = new MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 });

  // Triangle sail shape.
  const sailShape = new Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(0, 1.3);
  sailShape.lineTo(0.85, 0);
  sailShape.closePath();
  const sailGeo = new ShapeGeometry(sailShape);

  const hullGeo = new BoxGeometry(0.55, 0.28, 1.7);
  const deckGeo = new BoxGeometry(0.45, 0.08, 1.3);
  const mastGeo = new CylinderGeometry(0.03, 0.03, 1.5, 6);

  // --- Sailboats on the water ---
  for (let i = 0; i < 7; i++) {
    sampleRoadFrame(hash01(i, 1.3), frame);
    const lateral = oceanSign * (38 + hash01(i, 2.7) * 55);
    const x = frame.point.x + frame.side.x * lateral;
    const z = frame.point.z + frame.side.z * lateral;

    const boat = new Group();
    const hull = new Mesh(hullGeo, hullMat);
    hull.castShadow = true;
    boat.add(hull);
    const stripe = new Mesh(deckGeo, trimMat);
    stripe.position.y = 0.12;
    boat.add(stripe);
    const mast = new Mesh(mastGeo, mastMat);
    mast.position.set(0, 0.75, 0.1);
    boat.add(mast);
    const sail = new Mesh(sailGeo, sailMat);
    sail.position.set(0, 0.1, 0.08);
    sail.rotation.y = -Math.PI / 2;
    boat.add(sail);

    boat.position.set(x, SEA_LEVEL, z);
    boat.rotation.y = hash01(i, 4.1) * Math.PI * 2;
    root.add(boat);
  }

  // --- Beach parasols near the shore ---
  const poleGeo = new CylinderGeometry(0.035, 0.035, 2, 6);
  const canopyGeo = new ConeGeometry(0.85, 0.45, 12);
  for (let i = 0; i < 16; i++) {
    sampleRoadFrame(hash01(i, 5.5), frame);
    const lateral = oceanSign * (ROAD_WIDTH * 0.5 + 4 + hash01(i, 6.6) * 7);
    const x = frame.point.x + frame.side.x * lateral;
    const z = frame.point.z + frame.side.z * lateral;
    const groundY = Math.max(cliffHeightAt(x, z), SEA_LEVEL + 0.2);

    const parasol = new Group();
    const pole = new Mesh(poleGeo, poleMat);
    pole.position.y = 1;
    parasol.add(pole);
    const colorIdx = Math.floor(hash01(i, 7.7) * PARASOL_COLORS.length);
    const canopy = new Mesh(
      canopyGeo,
      new MeshStandardMaterial({ color: PARASOL_COLORS[colorIdx] ?? 0xe8503a, roughness: 0.8 }),
    );
    canopy.position.y = 2;
    canopy.castShadow = true;
    parasol.add(canopy);
    parasol.position.set(x, groundY, z);
    parasol.rotation.z = (hash01(i, 8.8) - 0.5) * 0.15;
    root.add(parasol);
  }

  return root;
}
