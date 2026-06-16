import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Object3D,
} from "three";
import type { DriverVariant } from "@/stores/customization-store";

/**
 * Stylized seated driver, hands toward the wheel — built from primitives.
 * Local origin at the seat base, facing +Z (car forward). Man/woman differ in
 * hair, outfit tint and shoulder width. Visible in the open convertible cockpit.
 */
export function createDriverFigure(variant: DriverVariant): Object3D {
  const g = new Group();
  const woman = variant === "woman";

  const skin = new MeshStandardMaterial({
    color: woman ? 0xd9a77f : 0xc89a6a,
    roughness: 0.72,
    metalness: 0,
  });
  const suit = new MeshStandardMaterial({
    color: woman ? 0x6a3550 : 0x23262d,
    roughness: 0.6,
    metalness: 0.06,
  });
  const hair = new MeshStandardMaterial({
    color: woman ? 0x3a2414 : 0x1e160f,
    roughness: 0.85,
    metalness: 0,
  });

  const add = (
    geo: BoxGeometry | CapsuleGeometry | SphereGeometry,
    mat: MeshStandardMaterial,
    x: number,
    y: number,
    z: number,
    rx = 0,
  ): Mesh => {
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.castShadow = true;
    g.add(m);
    return m;
  };

  // Torso (leaning back into the seat) + shoulders
  add(new CapsuleGeometry(0.15, 0.32, 4, 8), suit, 0, 0.42, -0.06, 0.14);
  add(new BoxGeometry(woman ? 0.36 : 0.44, 0.13, 0.2), suit, 0, 0.58, -0.04);

  // Head + hair
  add(new SphereGeometry(0.12, 16, 12), skin, 0, 0.76, -0.01);
  if (woman) {
    add(new SphereGeometry(0.125, 16, 12), hair, 0, 0.8, -0.04);
    add(new BoxGeometry(0.2, 0.26, 0.12), hair, 0, 0.64, -0.13); // long hair
  } else {
    add(new SphereGeometry(0.122, 16, 12), hair, 0, 0.81, -0.04); // short cap
  }

  // Arms reaching forward to the wheel + hands
  add(new CapsuleGeometry(0.05, 0.32, 4, 6), suit, -0.18, 0.5, 0.12, -0.95);
  add(new CapsuleGeometry(0.05, 0.32, 4, 6), suit, 0.18, 0.5, 0.12, -0.95);
  add(new SphereGeometry(0.055, 10, 8), skin, -0.13, 0.46, 0.32);
  add(new SphereGeometry(0.055, 10, 8), skin, 0.13, 0.46, 0.32);

  // Lap / thighs (under the dash)
  add(new BoxGeometry(0.34, 0.12, 0.32), suit, 0, 0.26, 0.14);

  return g;
}
