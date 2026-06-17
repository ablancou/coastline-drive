import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  type Object3D,
} from "three";
import { createDriverFigure } from "@/game/procedural/geometry/driver";

/**
 * Porsche 550 Spyder-inspired roadster, built procedurally by EXTRUDING a real
 * side-profile silhouette (length × height) across the car width with a rounded
 * bevel — so the body reads as smooth sheet metal with a low nose, sunken
 * cockpit and rear deck. Pontoon fenders, twin headrest fairings, low wraparound
 * screen and an open cockpit with a visible driver are added on top.
 *
 * userData: paintMaterial, driverMan, driverWoman (for runtime customization).
 */
function build550Shell(): ExtrudeGeometry {
  // Profile in the X(length, +forward) / Y(height) plane.
  const s = new Shape();
  s.moveTo(-2.0, -0.28);
  s.lineTo(1.9, -0.28); // floor
  s.quadraticCurveTo(2.18, -0.24, 2.08, 0.02); // rounded nose tip
  s.quadraticCurveTo(1.96, 0.16, 1.5, 0.12); // hood front
  s.quadraticCurveTo(0.85, 0.1, 0.52, 0.2); // hood up to cowl
  s.quadraticCurveTo(0.46, 0.24, 0.4, 0.12); // cowl crest, dip into cockpit
  s.lineTo(-0.5, 0.12); // cockpit valley (low door line)
  s.quadraticCurveTo(-0.82, 0.14, -1.1, 0.26); // rise to rear deck
  s.quadraticCurveTo(-1.5, 0.27, -1.72, 0.2); // deck to tail
  s.quadraticCurveTo(-1.99, 0.15, -2.06, 0.0); // tail tip
  s.quadraticCurveTo(-2.12, -0.16, -2.0, -0.28); // close
  s.closePath();

  const depth = 1.5;
  const geo = new ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelThickness: 0.1,
    bevelSize: 0.14,
    steps: 1,
    curveSegments: 28,
  });
  geo.translate(0, 0, -depth / 2); // center on width
  geo.rotateY(-Math.PI / 2); // length → +Z (forward)
  geo.computeVertexNormals();
  return geo;
}

export function createVehicleBodyGroup(colorHex: string | number = 0xb10f1a): Object3D {
  const group = new Group();
  const unit = new SphereGeometry(1, 24, 18);

  const paint = new MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.6,
    roughness: 0.32,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.3,
  });
  const chrome = new MeshStandardMaterial({
    color: 0xe2e8ee,
    metalness: 1,
    roughness: 0.12,
    envMapIntensity: 1.6,
  });
  const interiorMat = new MeshStandardMaterial({ color: 0x15171c, metalness: 0.2, roughness: 0.7 });
  const leather = new MeshStandardMaterial({ color: 0x2c2620, metalness: 0.1, roughness: 0.6 });
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
    geo: SphereGeometry | BoxGeometry | CylinderGeometry | ExtrudeGeometry,
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

  // --- Sculpted body shell (extruded 550 profile) ---
  add(build550Shell(), paint, [0, 0, 0]);

  // --- Pontoon fenders over the wheels ---
  add(unit, paint, [-0.86, 0.0, 1.4], [0.34, 0.3, 0.62]);
  add(unit, paint, [0.86, 0.0, 1.4], [0.34, 0.3, 0.62]);
  add(unit, paint, [-0.9, 0.02, -1.38], [0.36, 0.32, 0.68]);
  add(unit, paint, [0.9, 0.02, -1.38], [0.36, 0.32, 0.68]);

  // --- Twin headrest fairings on the rear deck (iconic 550) ---
  add(unit, paint, [-0.3, 0.3, -0.85], [0.26, 0.22, 0.55]);
  add(unit, paint, [0.3, 0.3, -0.85], [0.26, 0.22, 0.55]);

  // --- Open cockpit: dark tub + low seats ---
  add(new BoxGeometry(1.0, 0.1, 1.15), interiorMat, [0, 0.16, -0.15]);
  for (const sx of [-0.34, 0.34]) {
    add(unit, leather, [sx, 0.22, -0.28], [0.24, 0.1, 0.26]);
    add(unit, leather, [sx, 0.32, -0.5], [0.24, 0.16, 0.12]);
  }

  // --- Low wraparound windscreen ---
  add(new BoxGeometry(1.0, 0.03, 0.05), chrome, [0, 0.4, 0.42], [1, 1, 1], [-0.5, 0, 0]);
  add(new BoxGeometry(0.94, 0.12, 0.02), glass, [0, 0.45, 0.41], [1, 1, 1], [-0.5, 0, 0]);

  // --- Steering wheel (left-hand drive: +X) ---
  add(new CylinderGeometry(0.02, 0.02, 0.2, 8), chrome, [0.42, 0.28, 0.2], [1, 1, 1], [Math.PI / 2 - 0.5, 0, 0]);
  add(unit, interiorMat, [0.42, 0.32, 0.1], [0.15, 0.15, 0.03]);

  // --- Round lamps + intake + over-riders ---
  add(unit, headlight, [-0.6, 0.1, 1.92], [0.12, 0.13, 0.1]);
  add(unit, headlight, [0.6, 0.1, 1.92], [0.12, 0.13, 0.1]);
  add(new BoxGeometry(0.5, 0.12, 0.06), interiorMat, [0, -0.04, 2.12]);
  add(unit, chrome, [-0.4, -0.04, 2.14], [0.06, 0.09, 0.06]);
  add(unit, chrome, [0.4, -0.04, 2.14], [0.06, 0.09, 0.06]);

  // --- Tail lamps + dual exhausts ---
  add(unit, taillight, [-0.5, 0.12, -2.0], [0.1, 0.1, 0.06]);
  add(unit, taillight, [0.5, 0.12, -2.0], [0.1, 0.1, 0.06]);
  const pipe = new CylinderGeometry(0.05, 0.05, 0.18, 12);
  add(pipe, chrome, [-0.32, -0.1, -2.0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(pipe, chrome, [0.32, -0.1, -2.0], [1, 1, 1], [Math.PI / 2, 0, 0]);

  // --- Chrome belt-line trim ---
  add(new BoxGeometry(0.02, 0.03, 3.0), chrome, [-0.86, 0.14, -0.1]);
  add(new BoxGeometry(0.02, 0.03, 3.0), chrome, [0.86, 0.14, -0.1]);

  // --- Driver figures (left-hand drive: +X), raised so they read clearly ---
  const driverMan = createDriverFigure("man");
  const driverWoman = createDriverFigure("woman");
  for (const d of [driverMan, driverWoman]) {
    d.position.set(0.42, 0.06, -0.32);
    d.scale.setScalar(0.9);
    group.add(d);
  }
  driverWoman.visible = false;

  group.userData.paintMaterial = paint;
  group.userData.driverMan = driverMan;
  group.userData.driverWoman = driverWoman;

  return group;
}
