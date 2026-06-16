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

/**
 * Restomod European GT — composed from primitives, no imported GLTF.
 * Sculpted silhouette: low wide body, flared arches, fastback greenhouse,
 * chrome trim, emissive lighting. Paint uses a clearcoat physical material so
 * the procedural environment map reads as deep automotive lacquer.
 */
export function createVehicleBodyGroup(): Object3D {
  const group = new Group();

  // Signature "Coastline Rosso" — deep metallic red with a clearcoat lacquer.
  const paint = new MeshPhysicalMaterial({
    color: 0xb10f1a,
    metalness: 0.55,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.25,
  });

  const carbon = new MeshStandardMaterial({
    color: 0x14171c,
    metalness: 0.5,
    roughness: 0.45,
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
    opacity: 0.55,
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
    geo: BoxGeometry | CylinderGeometry | SphereGeometry,
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

  // --- Lower body / floor pan (wide, low) ---
  add(new BoxGeometry(1.88, 0.34, 4.0), paint, 0, 0.06, 0);

  // --- Upper body shoulder line (tapered narrower on top) ---
  const shoulder = add(new BoxGeometry(1.74, 0.3, 3.7), paint, 0, 0.32, -0.02);
  shoulder.scale.z = 1.0;

  // --- Long hood with a subtle slope ---
  const hood = add(new BoxGeometry(1.62, 0.16, 1.55), paint, 0, 0.45, 1.25);
  hood.rotation.x = -0.05;
  // Hood vents
  add(new BoxGeometry(0.34, 0.04, 0.5), carbon, -0.36, 0.54, 1.2);
  add(new BoxGeometry(0.34, 0.04, 0.5), carbon, 0.36, 0.54, 1.2);

  // --- Fastback cabin ---
  const cabin = add(new BoxGeometry(1.46, 0.46, 1.7), paint, 0, 0.6, -0.25);
  cabin.scale.set(1, 1, 1);
  // Roof (slightly narrower → coupe taper)
  const roof = add(new BoxGeometry(1.28, 0.12, 1.3), paint, 0, 0.86, -0.3);
  roof.scale.x = 1;

  // --- Greenhouse glass ---
  const windshield = add(new BoxGeometry(1.3, 0.5, 0.08), glass, 0, 0.74, 0.62);
  windshield.rotation.x = -0.62;
  const rearGlass = add(new BoxGeometry(1.26, 0.46, 0.08), glass, 0, 0.74, -1.08);
  rearGlass.rotation.x = 0.7;
  // Side windows
  add(new BoxGeometry(0.04, 0.34, 1.34), glass, -0.72, 0.74, -0.3);
  add(new BoxGeometry(0.04, 0.34, 1.34), glass, 0.72, 0.74, -0.3);

  // --- Rear fastback deck + ducktail ---
  const deck = add(new BoxGeometry(1.66, 0.22, 1.0), paint, 0, 0.5, -1.55);
  deck.rotation.x = 0.16;

  // --- Wheel arches (flared fenders) ---
  const archGeo = new CylinderGeometry(0.5, 0.5, 0.36, 16, 1, true, 0, Math.PI);
  const archPositions: [number, number, number][] = [
    [-0.92, 0.16, 1.42],
    [0.92, 0.16, 1.42],
    [-0.92, 0.16, -1.4],
    [0.92, 0.16, -1.4],
  ];
  for (const [ax, ay, az] of archPositions) {
    const arch = add(archGeo, carbon, ax, ay, az);
    arch.rotation.z = Math.PI / 2;
    arch.scale.set(1, 1, 1.05);
  }

  // --- Front fascia: splitter, grille, chrome bumper ---
  add(new BoxGeometry(1.9, 0.08, 0.34), carbon, 0, -0.06, 2.0); // splitter
  add(new BoxGeometry(1.3, 0.26, 0.1), carbon, 0, 0.18, 2.04); // grille
  add(new BoxGeometry(1.84, 0.06, 0.12), chrome, 0, 0.34, 2.02); // chrome lip

  // Headlights (emissive)
  add(new SphereGeometry(0.16, 16, 12), headlight, -0.66, 0.3, 1.96);
  add(new SphereGeometry(0.16, 16, 12), headlight, 0.66, 0.3, 1.96);

  // --- Rear fascia: light bar, diffuser, exhausts ---
  add(new BoxGeometry(1.64, 0.16, 0.06), taillight, 0, 0.42, -2.02); // full-width light bar
  add(new BoxGeometry(1.7, 0.12, 0.3), carbon, 0, 0.04, -1.98); // diffuser
  const exhaust = new CylinderGeometry(0.07, 0.07, 0.22, 12);
  const exL = add(exhaust, chrome, -0.42, -0.04, -2.08);
  exL.rotation.x = Math.PI / 2;
  const exR = add(exhaust, chrome, 0.42, -0.04, -2.08);
  exR.rotation.x = Math.PI / 2;

  // --- Side mirrors ---
  add(new BoxGeometry(0.16, 0.1, 0.14), carbon, -0.86, 0.66, 0.5);
  add(new BoxGeometry(0.16, 0.1, 0.14), carbon, 0.86, 0.66, 0.5);

  // --- Rocker / side skirts ---
  add(new BoxGeometry(0.12, 0.12, 2.6), carbon, -0.94, -0.06, -0.1);
  add(new BoxGeometry(0.12, 0.12, 2.6), carbon, 0.94, -0.06, -0.1);

  return group;
}
