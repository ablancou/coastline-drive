import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  type Object3D,
} from "three";
import { createDriverFigure } from "@/game/procedural/geometry/driver";

/**
 * Porsche 550 Spyder-inspired roadster — a low, curvaceous open two-seater built
 * almost entirely from scaled ellipsoids (a shared unit sphere) so the shapes
 * read as smooth sheet-metal rather than boxes. Signature cues: rounded pontoon
 * body, low cut cockpit, twin headrest fairings, small round lamps.
 *
 * Exposes for runtime customization via `userData`:
 *   paintMaterial : MeshPhysicalMaterial
 *   driverMan / driverWoman : Object3D (toggle visibility)
 */
export function createVehicleBodyGroup(colorHex: string | number = 0xb10f1a): Object3D {
  const group = new Group();
  const unit = new SphereGeometry(1, 28, 20); // shared; scaled per part

  const paint = new MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.5,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
  });
  const chrome = new MeshStandardMaterial({
    color: 0xe2e8ee,
    metalness: 1,
    roughness: 0.1,
    envMapIntensity: 1.6,
  });
  const interiorMat = new MeshStandardMaterial({
    color: 0x16181d,
    metalness: 0.2,
    roughness: 0.7,
  });
  const leather = new MeshStandardMaterial({
    color: 0x2c2620,
    metalness: 0.1,
    roughness: 0.6,
  });
  const glass = new MeshPhysicalMaterial({
    color: 0x223040,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.7,
    transparent: true,
    opacity: 0.45,
    envMapIntensity: 1.4,
  });
  const headlight = new MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff4d2,
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  const taillight = new MeshStandardMaterial({
    color: 0x2a0406,
    emissive: 0xff2233,
    emissiveIntensity: 2.6,
    roughness: 0.3,
  });

  type V3 = [number, number, number];
  const add = (
    geo: SphereGeometry | BoxGeometry | CylinderGeometry,
    mat: MeshStandardMaterial | MeshPhysicalMaterial,
    pos: V3,
    scale: V3 = [1, 1, 1],
    rot: V3 = [0, 0, 0],
  ): Mesh => {
    const m = new Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    m.rotation.set(...rot);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  // --- Main rounded pontoon body (low + wide) ---
  add(unit, paint, [0, 0.04, -0.1], [0.96, 0.34, 1.95]);
  // Smooth nose sloping down to the front
  add(unit, paint, [0, 0.0, 1.55], [0.82, 0.26, 0.8]);
  // Rounded tail
  add(unit, paint, [0, 0.06, -1.6], [0.92, 0.32, 0.82]);

  // --- Pontoon fenders over the wheels ---
  add(unit, paint, [-0.78, 0.12, 1.32], [0.42, 0.34, 0.66]);
  add(unit, paint, [0.78, 0.12, 1.32], [0.42, 0.34, 0.66]);
  add(unit, paint, [-0.82, 0.14, -1.32], [0.46, 0.36, 0.72]);
  add(unit, paint, [0.82, 0.14, -1.32], [0.46, 0.36, 0.72]);

  // --- Cowl in front of the cockpit ---
  add(unit, paint, [0, 0.2, 0.6], [0.72, 0.18, 0.36]);

  // --- Open cockpit: dark recessed tub + low seats ---
  add(unit, interiorMat, [0, 0.18, -0.18], [0.6, 0.16, 0.82]);
  for (const sx of [-0.34, 0.34]) {
    add(unit, leather, [sx, 0.26, -0.28], [0.24, 0.1, 0.26]); // cushion
    add(unit, leather, [sx, 0.36, -0.5], [0.24, 0.2, 0.12]); // low backrest
  }

  // --- Iconic twin headrest fairings sweeping back to the tail ---
  add(unit, paint, [-0.34, 0.34, -0.95], [0.27, 0.26, 0.62]);
  add(unit, paint, [0.34, 0.34, -0.95], [0.27, 0.26, 0.62]);

  // --- Low wraparound windscreen (chrome frame + glass) ---
  const wsFrame = add(new BoxGeometry(1.0, 0.03, 0.05), chrome, [0, 0.45, 0.42], [1, 1, 1], [-0.5, 0, 0]);
  void wsFrame;
  add(new BoxGeometry(0.94, 0.13, 0.02), glass, [0, 0.5, 0.41], [1, 1, 1], [-0.5, 0, 0]);

  // --- Steering wheel (left-hand drive: +X) ---
  const wheelCol = add(new CylinderGeometry(0.02, 0.02, 0.2, 8), chrome, [0.42, 0.34, 0.18], [1, 1, 1], [Math.PI / 2 - 0.5, 0, 0]);
  void wheelCol;
  add(unit, interiorMat, [0.42, 0.38, 0.08], [0.15, 0.15, 0.03]); // wheel disc (thin)

  // --- Small round headlamps faired into the front ---
  add(unit, headlight, [-0.6, 0.18, 1.78], [0.12, 0.13, 0.1]);
  add(unit, headlight, [0.6, 0.18, 1.78], [0.12, 0.13, 0.1]);
  // Subtle front intake
  add(new BoxGeometry(0.5, 0.12, 0.06), interiorMat, [0, 0.02, 2.04]);
  // Chrome over-riders (front + rear)
  add(unit, chrome, [-0.4, 0.04, 2.02], [0.06, 0.09, 0.06]);
  add(unit, chrome, [0.4, 0.04, 2.02], [0.06, 0.09, 0.06]);

  // --- Small round tail lamps + dual exhaust tips ---
  add(unit, taillight, [-0.5, 0.16, -1.98], [0.1, 0.1, 0.06]);
  add(unit, taillight, [0.5, 0.16, -1.98], [0.1, 0.1, 0.06]);
  const pipe = new CylinderGeometry(0.05, 0.05, 0.18, 12);
  add(pipe, chrome, [-0.32, -0.04, -1.98], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(pipe, chrome, [0.32, -0.04, -1.98], [1, 1, 1], [Math.PI / 2, 0, 0]);

  // --- Chrome belt-line trim along each flank ---
  add(new BoxGeometry(0.02, 0.03, 2.7), chrome, [-0.92, 0.2, -0.1]);
  add(new BoxGeometry(0.02, 0.03, 2.7), chrome, [0.92, 0.2, -0.1]);

  // --- Driver figures (left-hand drive: +X), raised so they read clearly ---
  const driverMan = createDriverFigure("man");
  const driverWoman = createDriverFigure("woman");
  for (const d of [driverMan, driverWoman]) {
    d.position.set(0.42, 0.12, -0.32);
    d.scale.setScalar(0.92);
    group.add(d);
  }
  driverWoman.visible = false;

  group.userData.paintMaterial = paint;
  group.userData.driverMan = driverMan;
  group.userData.driverWoman = driverWoman;

  return group;
}
