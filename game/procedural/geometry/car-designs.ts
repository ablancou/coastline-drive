import {
  BoxGeometry,
  type BufferGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  type Object3D,
} from "three";
import { getCarDesign, type CarDesign } from "@/game/constants/cars";
import { createDriverFigure } from "@/game/procedural/geometry/driver";

/** Base roadster side profile (X = length forward, Y = height) → extruded. */
function buildShell(width: number): ExtrudeGeometry {
  const s = new Shape();
  s.moveTo(-2.0, -0.28);
  s.lineTo(1.9, -0.28);
  s.quadraticCurveTo(2.18, -0.24, 2.08, 0.02);
  s.quadraticCurveTo(1.96, 0.16, 1.5, 0.12);
  s.quadraticCurveTo(0.85, 0.1, 0.52, 0.2);
  s.quadraticCurveTo(0.46, 0.24, 0.4, 0.12);
  s.lineTo(-0.5, 0.12);
  s.quadraticCurveTo(-0.82, 0.14, -1.1, 0.26);
  s.quadraticCurveTo(-1.5, 0.27, -1.72, 0.2);
  s.quadraticCurveTo(-1.99, 0.15, -2.06, 0.0);
  s.quadraticCurveTo(-2.12, -0.16, -2.0, -0.28);
  s.closePath();

  const geo = new ExtrudeGeometry(s, {
    depth: width,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelThickness: 0.1,
    bevelSize: 0.14,
    steps: 1,
    curveSegments: 28,
  });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Build an original roadster body for the given design id. */
export function createCarBody(
  designId: string,
  colorHex: string | number = 0xb10f1a,
  withDriver = true,
): Object3D {
  const design: CarDesign = getCarDesign(designId);
  const group = new Group();
  const unit = new SphereGeometry(1, 24, 18);

  const paint = new MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.6,
    roughness: 0.3,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.3,
  });
  const chrome = new MeshStandardMaterial({ color: 0xe2e8ee, metalness: 1, roughness: 0.12, envMapIntensity: 1.6 });
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
  const headlight = new MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d2, emissiveIntensity: 2.2, roughness: 0.2 });
  const taillight = new MeshStandardMaterial({ color: 0x2a0406, emissive: 0xff2233, emissiveIntensity: 2.6, roughness: 0.3 });

  type V3 = [number, number, number];
  const add = (geo: BufferGeometry, mat: MeshStandardMaterial | MeshPhysicalMaterial, pos: V3, scale: V3 = [1, 1, 1], rot: V3 = [0, 0, 0]): Mesh => {
    const m = new Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    m.rotation.set(...rot);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  // --- Sculpted shell (scaled per design) ---
  add(buildShell(design.width), paint, [0, 0, 0], [1, design.heightScale, design.lengthScale]);

  // --- Fender arches ---
  const fenderGeo = new TorusGeometry(0.46, 0.12, 8, 16, Math.PI);
  for (const [fx, fz] of [
    [-0.9, 1.4],
    [0.9, 1.4],
    [-0.92, -1.38],
    [0.92, -1.38],
  ] as const) {
    add(fenderGeo, paint, [fx, -0.42, fz], [1, 1, 1], [0, Math.PI / 2, 0]);
  }

  // --- Rear deck treatment ---
  if (design.fairing === "twin") {
    const fairing = new CapsuleGeometry(0.14, 0.42, 4, 10);
    add(fairing, paint, [-0.3, 0.28, -0.9], [1, 1, 1], [Math.PI / 2, 0, 0]);
    add(fairing, paint, [0.3, 0.28, -0.9], [1, 1, 1], [Math.PI / 2, 0, 0]);
  } else if (design.fairing === "double") {
    const bubble = new CapsuleGeometry(0.16, 0.34, 4, 10);
    add(bubble, paint, [-0.34, 0.24, -0.85], [1, 0.7, 1], [Math.PI / 2, 0, 0]);
    add(bubble, paint, [0.34, 0.24, -0.85], [1, 0.7, 1], [Math.PI / 2, 0, 0]);
  } else {
    // 'none' → a single smooth rounded tonneau bump.
    add(unit, paint, [0, 0.24, -0.95], [0.55, 0.18, 0.5]);
  }

  // --- Open cockpit: recessed footwell + low seats ---
  add(new BoxGeometry(0.92, 0.18, 1.22), interiorMat, [0, -0.02, -0.15]);
  for (const sx of [-0.32, 0.32]) {
    add(new BoxGeometry(0.34, 0.05, 0.36), leather, [sx, 0.07, -0.3]);
    add(new BoxGeometry(0.34, 0.22, 0.07), leather, [sx, 0.17, -0.52]);
  }

  // --- Windscreen (height per design) with chrome side pillars ---
  add(new BoxGeometry(1.0, 0.03, 0.05), chrome, [0, 0.36, 0.42], [1, 1, 1], [-0.5, 0, 0]);
  add(new BoxGeometry(0.94, design.screenHeight, 0.02), glass, [0, 0.41, 0.41], [1, 1, 1], [-0.5, 0, 0]);
  for (const s of [-1, 1] as const) {
    add(
      new BoxGeometry(0.025, design.screenHeight + 0.04, 0.03),
      chrome,
      [s * 0.475, 0.41, 0.41],
      [1, 1, 1],
      [-0.5, 0, 0],
    );
  }

  // --- Dashboard: body-color cowl top + two chrome-ringed gauges (LHD) ---
  add(new BoxGeometry(0.94, 0.05, 0.16), paint, [0, 0.3, 0.3]);
  const gaugeRing = new TorusGeometry(0.045, 0.01, 8, 16);
  const gaugeFace = new MeshStandardMaterial({ color: 0xf0ead8, roughness: 0.5 });
  for (const gx of [0.3, 0.54]) {
    add(gaugeRing, chrome, [gx, 0.27, 0.245], [1, 1, 1], [-0.35, 0, 0]);
    add(unit, gaugeFace, [gx, 0.27, 0.24], [0.04, 0.04, 0.008], [-0.35, 0, 0]);
  }

  // --- Steering wheel (LHD) + gear shifter on the tunnel ---
  add(new CylinderGeometry(0.02, 0.02, 0.18, 8), chrome, [0.42, 0.18, 0.12], [1, 1, 1], [Math.PI / 2 - 0.5, 0, 0]);
  add(unit, interiorMat, [0.42, 0.22, 0.04], [0.14, 0.14, 0.025]);
  add(new CylinderGeometry(0.012, 0.014, 0.16, 8), chrome, [0.08, 0.12, -0.08], [1, 1, 1], [-0.35, 0, 0]);
  add(unit, leather, [0.08, 0.2, -0.11], [0.03, 0.03, 0.03]);

  // --- Round lamps (chrome bezels) + intake + over-riders ---
  const bezel = new TorusGeometry(0.15, 0.02, 8, 18);
  add(unit, headlight, [-0.6, 0.1, 1.92], [0.12, 0.13, 0.1]);
  add(unit, headlight, [0.6, 0.1, 1.92], [0.12, 0.13, 0.1]);
  add(bezel, chrome, [-0.6, 0.1, 1.98]);
  add(bezel, chrome, [0.6, 0.1, 1.98]);
  add(new BoxGeometry(0.5, 0.12, 0.06), interiorMat, [0, -0.04, 2.12]);
  add(unit, chrome, [-0.4, -0.04, 2.14], [0.06, 0.09, 0.06]);
  add(unit, chrome, [0.4, -0.04, 2.14], [0.06, 0.09, 0.06]);

  // --- Tail lamps + dual exhausts + belt-line trim ---
  add(unit, taillight, [-0.5, 0.12, -2.0], [0.1, 0.1, 0.06]);
  add(unit, taillight, [0.5, 0.12, -2.0], [0.1, 0.1, 0.06]);
  const pipe = new CylinderGeometry(0.05, 0.05, 0.18, 12);
  add(pipe, chrome, [-0.32, -0.1, -2.0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(pipe, chrome, [0.32, -0.1, -2.0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(new BoxGeometry(0.02, 0.03, 3.0), chrome, [-0.86, 0.14, -0.1]);
  add(new BoxGeometry(0.02, 0.03, 3.0), chrome, [0.86, 0.14, -0.1]);

  // --- Door seams + side vents (dark recessed lines; 550-style gills) ---
  const seamMat = new MeshStandardMaterial({ color: 0x101216, roughness: 0.6 });
  for (const s of [-1, 1] as const) {
    // Vertical door cut lines fore/aft of the cockpit.
    add(new BoxGeometry(0.012, 0.24, 0.015), seamMat, [s * 0.885, -0.05, 0.5]);
    add(new BoxGeometry(0.012, 0.24, 0.015), seamMat, [s * 0.885, -0.05, -0.62]);
    // Three angled gills behind the front wheel.
    for (let k = 0; k < 3; k++) {
      add(
        new BoxGeometry(0.015, 0.11, 0.03),
        seamMat,
        [s * 0.885, -0.14, 0.86 - k * 0.09],
        [1, 1, 1],
        [0, 0, s * 0.25],
      );
    }
    // Fuel filler cap on the left rear deck only (vintage single-filler).
    if (s === 1) {
      add(new CylinderGeometry(0.07, 0.07, 0.02, 14), chrome, [0.45, 0.265, -1.15]);
    }
  }

  // --- Rear plate badge (original "CD" mark — no real-world branding) ---
  add(new BoxGeometry(0.34, 0.12, 0.02), chrome, [0, -0.02, -2.07]);
  add(new BoxGeometry(0.3, 0.09, 0.01), interiorMat, [0, -0.02, -2.08]);

  // --- Chrome side mirrors on slim stalks (cowl-mounted) ---
  const mirrorFace = new MeshStandardMaterial({ color: 0x9fb2c4, metalness: 1, roughness: 0.05, envMapIntensity: 1.8 });
  for (const s of [-1, 1] as const) {
    add(new BoxGeometry(0.16, 0.025, 0.025), chrome, [s * 0.95, 0.26, 0.42]);
    add(unit, chrome, [s * 1.04, 0.29, 0.42], [0.055, 0.07, 0.035]);
    add(unit, mirrorFace, [s * 1.04, 0.29, 0.455], [0.04, 0.055, 0.01]);
  }

  // --- Front chrome grille (horizontal slats between the lamps) ---
  for (let k = 0; k < 3; k++) {
    add(new BoxGeometry(0.66, 0.02, 0.02), chrome, [0, -0.05 + k * 0.06, 2.13]);
  }
  // Nose badge.
  add(unit, chrome, [0, 0.12, 2.14], [0.05, 0.05, 0.03]);

  // --- Bonnet centre crease (chrome strip) ---
  add(new BoxGeometry(0.025, 0.02, 1.35), chrome, [0, 0.16, 1.16]);

  // --- Driver figures (LHD, seated low) ---
  if (withDriver) {
    const driverMan = createDriverFigure("man");
    const driverWoman = createDriverFigure("woman");
    for (const d of [driverMan, driverWoman]) {
      d.position.set(0.42, -0.08, -0.34);
      d.scale.setScalar(0.78);
      group.add(d);
    }
    driverWoman.visible = false;
    group.userData.driverMan = driverMan;
    group.userData.driverWoman = driverWoman;
  }

  group.userData.paintMaterial = paint;
  // Runtime hooks: brake lights flare on brake, headlights dip/rise with night.
  group.userData.taillightMaterial = taillight;
  group.userData.headlightMaterial = headlight;

  return group;
}
