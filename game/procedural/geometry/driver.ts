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
 * Stylized seated driver — built from primitives, facing +Z (car forward),
 * local origin at the seat base. Man/woman differ in hair, outfit and build.
 * Sunglasses add an elegant GT feel and read well at a distance.
 */
export function createDriverFigure(variant: DriverVariant): Object3D {
  const g = new Group();
  const woman = variant === "woman";

  const skin = new MeshStandardMaterial({
    color: woman ? 0xe0b48c : 0xcf9e72,
    roughness: 0.7,
  });
  const suit = new MeshStandardMaterial({
    color: woman ? 0x7a3a5a : 0x222933,
    roughness: 0.55,
    metalness: 0.05,
  });
  const hair = new MeshStandardMaterial({
    color: woman ? 0x3a2414 : 0x1d150e,
    roughness: 0.85,
  });
  const dark = new MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.4, metalness: 0.3 });

  const add = (
    geo: BoxGeometry | CapsuleGeometry | SphereGeometry,
    mat: MeshStandardMaterial,
    x: number,
    y: number,
    z: number,
    rx = 0,
    rz = 0,
  ): Mesh => {
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.rotation.z = rz;
    m.castShadow = true;
    g.add(m);
    return m;
  };

  // Pelvis + torso (slightly reclined), chest taper
  add(new CapsuleGeometry(0.17, 0.16, 4, 10), suit, 0, 0.26, -0.04);
  add(new CapsuleGeometry(0.16, 0.34, 4, 10), suit, 0, 0.5, -0.07, 0.12);
  // Shoulders
  add(new CapsuleGeometry(0.09, woman ? 0.3 : 0.4, 4, 8), suit, 0, 0.66, -0.04, 0, Math.PI / 2);

  // Neck + head
  add(new CapsuleGeometry(0.06, 0.05, 4, 8), skin, 0, 0.78, -0.03);
  add(new SphereGeometry(0.13, 18, 14), skin, 0, 0.9, -0.01);
  // Sunglasses (thin dark bar across the eyes)
  add(new BoxGeometry(0.2, 0.05, 0.04), dark, 0, 0.91, 0.1);

  // Hair
  if (woman) {
    add(new SphereGeometry(0.135, 16, 12), hair, 0, 0.94, -0.04);
    add(new CapsuleGeometry(0.1, 0.22, 4, 8), hair, 0, 0.78, -0.14); // ponytail down back
  } else {
    add(new SphereGeometry(0.135, 16, 12), hair, 0, 0.95, -0.05); // short cap
  }

  // Arms: upper + forearm reaching to the wheel, with hands
  for (const sx of [-1, 1]) {
    add(new CapsuleGeometry(0.055, 0.22, 4, 8), suit, sx * 0.2, 0.58, 0.0, 0.4); // upper arm
    add(new CapsuleGeometry(0.05, 0.26, 4, 8), suit, sx * 0.16, 0.46, 0.22, 1.1); // forearm fwd
    add(new SphereGeometry(0.06, 10, 8), skin, sx * 0.13, 0.42, 0.36); // hand
  }

  // Thighs forward under the dash
  add(new CapsuleGeometry(0.09, 0.26, 4, 8), suit, -0.1, 0.2, 0.18, 1.2);
  add(new CapsuleGeometry(0.09, 0.26, 4, 8), suit, 0.1, 0.2, 0.18, 1.2);

  return g;
}
