import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  type Object3D,
} from "three";
import { createDriverFigure } from "@/game/procedural/geometry/driver";

/**
 * Elegant convertible grand-tourer — open cockpit roadster composed from
 * primitives (no GLTF). Exposes its paint material and driver figures via
 * `userData` so the controller can recolor the car and swap the driver at
 * runtime:
 *   group.userData.paintMaterial : MeshPhysicalMaterial
 *   group.userData.driverMan / driverWoman : Object3D (toggle visibility)
 */
export function createVehicleBodyGroup(colorHex: string | number = 0xb10f1a): Object3D {
  const group = new Group();

  const paint = new MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.55,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.3,
  });

  const carbon = new MeshStandardMaterial({
    color: 0x14171c,
    metalness: 0.5,
    roughness: 0.45,
  });

  const interior = new MeshStandardMaterial({
    color: 0x1b1d22,
    metalness: 0.2,
    roughness: 0.7,
  });

  const leather = new MeshStandardMaterial({
    color: 0x2a2520,
    metalness: 0.1,
    roughness: 0.6,
  });

  const chrome = new MeshStandardMaterial({
    color: 0xdfe6ee,
    metalness: 1,
    roughness: 0.12,
    envMapIntensity: 1.5,
  });

  const glass = new MeshPhysicalMaterial({
    color: 0x10171f,
    metalness: 0,
    roughness: 0.06,
    transmission: 0.6,
    transparent: true,
    opacity: 0.5,
    envMapIntensity: 1.4,
  });

  const headlight = new MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff2cc,
    emissiveIntensity: 2.4,
    metalness: 0.2,
    roughness: 0.2,
  });

  const taillight = new MeshStandardMaterial({
    color: 0x2a0406,
    emissive: 0xff1822,
    emissiveIntensity: 2.6,
    metalness: 0.1,
    roughness: 0.3,
  });

  const add = (
    geo: BoxGeometry | CylinderGeometry | SphereGeometry | TorusGeometry,
    mat: MeshStandardMaterial | MeshPhysicalMaterial,
    x: number,
    y: number,
    z: number,
  ): Mesh => {
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // --- Lower hull (wide, low) ---
  add(new BoxGeometry(1.88, 0.36, 4.0), paint, 0, 0.06, 0);

  // --- Long hood with a subtle slope + vents ---
  const hood = add(new BoxGeometry(1.66, 0.16, 1.7), paint, 0, 0.34, 1.25);
  hood.rotation.x = -0.04;
  add(new BoxGeometry(0.34, 0.04, 0.6), carbon, -0.36, 0.43, 1.2);
  add(new BoxGeometry(0.34, 0.04, 0.6), carbon, 0.36, 0.43, 1.2);

  // --- Cowl / dashboard in front of the open cockpit ---
  add(new BoxGeometry(1.6, 0.18, 0.4), paint, 0, 0.36, 0.62);
  add(new BoxGeometry(1.42, 0.12, 0.24), interior, 0, 0.42, 0.5); // dash top

  // --- Door-top side panels (leave the centre open = convertible cockpit) ---
  add(new BoxGeometry(0.2, 0.22, 1.9), paint, -0.84, 0.33, -0.2);
  add(new BoxGeometry(0.2, 0.22, 1.9), paint, 0.84, 0.33, -0.2);

  // --- Cockpit interior tub + seats ---
  add(new BoxGeometry(1.42, 0.08, 1.9), interior, 0, 0.26, -0.2); // floor
  // Two seats (driver left, passenger right)
  for (const sx of [-0.42, 0.42]) {
    add(new BoxGeometry(0.5, 0.12, 0.5), leather, sx, 0.34, -0.42); // cushion
    add(new BoxGeometry(0.5, 0.46, 0.12), leather, sx, 0.56, -0.66); // backrest
    add(new BoxGeometry(0.3, 0.16, 0.1), leather, sx, 0.82, -0.66); // headrest
  }

  // --- Steering wheel in front of the driver (left-hand drive: +X seat) ---
  const wheel = add(new TorusGeometry(0.16, 0.025, 10, 20), carbon, 0.42, 0.5, 0.16);
  wheel.rotation.x = Math.PI / 2 - 0.5;
  const column = add(new CylinderGeometry(0.02, 0.02, 0.22, 8), carbon, 0.42, 0.45, 0.28);
  column.rotation.x = Math.PI / 2 - 0.5;

  // --- Low raked windshield frame + glass ---
  const wsFrame = add(new BoxGeometry(1.34, 0.04, 0.36), chrome, 0, 0.56, 0.72);
  wsFrame.rotation.x = -0.7;
  const windshield = add(new BoxGeometry(1.28, 0.3, 0.04), glass, 0, 0.6, 0.7);
  windshield.rotation.x = -0.7;

  // --- Roll hoops behind the seats (elegant chrome) ---
  for (const sx of [-0.42, 0.42]) {
    const hoop = add(new TorusGeometry(0.2, 0.03, 8, 14, Math.PI), chrome, sx, 0.74, -0.9);
    hoop.rotation.z = 0;
  }

  // --- Rear deck + ducktail ---
  const deck = add(new BoxGeometry(1.7, 0.2, 1.1), paint, 0, 0.34, -1.5);
  deck.rotation.x = 0.12;

  // --- Wheel arches ---
  const archGeo = new CylinderGeometry(0.5, 0.5, 0.36, 16, 1, true, 0, Math.PI);
  for (const [ax, az] of [
    [-0.92, 1.42],
    [0.92, 1.42],
    [-0.92, -1.4],
    [0.92, -1.4],
  ] as const) {
    const arch = add(archGeo, carbon, ax, 0.16, az);
    arch.rotation.z = Math.PI / 2;
  }

  // --- Front fascia: splitter, grille, chrome lip, headlights ---
  add(new BoxGeometry(1.9, 0.08, 0.34), carbon, 0, -0.06, 2.0);
  add(new BoxGeometry(1.3, 0.26, 0.1), carbon, 0, 0.18, 2.04);
  add(new BoxGeometry(1.84, 0.06, 0.12), chrome, 0, 0.32, 2.02);
  add(new SphereGeometry(0.15, 16, 12), headlight, -0.66, 0.28, 1.96);
  add(new SphereGeometry(0.15, 16, 12), headlight, 0.66, 0.28, 1.96);

  // --- Rear fascia: light bar, diffuser, exhausts ---
  add(new BoxGeometry(1.64, 0.16, 0.06), taillight, 0, 0.4, -2.02);
  add(new BoxGeometry(1.7, 0.12, 0.3), carbon, 0, 0.02, -1.98);
  const exhaust = new CylinderGeometry(0.07, 0.07, 0.22, 12);
  const exL = add(exhaust, chrome, -0.42, -0.04, -2.08);
  exL.rotation.x = Math.PI / 2;
  const exR = add(exhaust, chrome, 0.42, -0.04, -2.08);
  exR.rotation.x = Math.PI / 2;

  // --- Side mirrors + rocker skirts ---
  add(new BoxGeometry(0.16, 0.1, 0.14), carbon, -0.92, 0.5, 0.55);
  add(new BoxGeometry(0.16, 0.1, 0.14), carbon, 0.92, 0.5, 0.55);
  add(new BoxGeometry(0.12, 0.12, 2.6), carbon, -0.94, -0.06, -0.1);
  add(new BoxGeometry(0.12, 0.12, 2.6), carbon, 0.94, -0.06, -0.1);

  // --- Driver figures (left-hand drive: +X seat) — toggled by the controller ---
  const seatPos = { x: 0.42, y: 0.18, z: -0.4 };
  const driverMan = createDriverFigure("man");
  const driverWoman = createDriverFigure("woman");
  for (const d of [driverMan, driverWoman]) {
    d.position.set(seatPos.x, seatPos.y, seatPos.z);
    d.scale.setScalar(0.82);
    group.add(d);
  }
  driverWoman.visible = false;

  group.userData.paintMaterial = paint;
  group.userData.driverMan = driverMan;
  group.userData.driverWoman = driverWoman;

  return group;
}
