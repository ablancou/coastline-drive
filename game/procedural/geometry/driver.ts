import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  type Object3D,
} from "three";
import type { DriverVariant } from "@/stores/customization-store";

/**
 * Stylized seated driver — built from primitives, facing +Z (car forward),
 * local origin at the seat base. Man/woman differ in hair, outfit and build.
 * Vintage GT details: leather gloves, harness belt, scarf/collar, sunglasses.
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
  const accent = new MeshStandardMaterial({
    color: woman ? 0xe8ddc8 : 0x8fa3b8,
    roughness: 0.6,
  });
  const hair = new MeshStandardMaterial({
    color: woman ? 0x3a2414 : 0x1d150e,
    roughness: 0.85,
  });
  const glove = new MeshStandardMaterial({ color: 0x4a3524, roughness: 0.65 });
  const belt = new MeshStandardMaterial({ color: 0x16181d, roughness: 0.5 });
  const dark = new MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.4, metalness: 0.3 });
  const chrome = new MeshStandardMaterial({ color: 0xe2e8ee, metalness: 1, roughness: 0.15 });

  const add = (
    geo: BoxGeometry | CapsuleGeometry | SphereGeometry | TorusGeometry,
    mat: MeshStandardMaterial,
    x: number,
    y: number,
    z: number,
    rx = 0,
    rz = 0,
    ry = 0,
  ): Mesh => {
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    g.add(m);
    return m;
  };

  // Pelvis + torso (slightly reclined), chest taper
  add(new CapsuleGeometry(0.17, 0.16, 4, 10), suit, 0, 0.26, -0.04);
  add(new CapsuleGeometry(0.16, 0.34, 4, 10), suit, 0, 0.5, -0.07, 0.12);
  // Shoulders
  add(new CapsuleGeometry(0.09, woman ? 0.3 : 0.4, 4, 8), suit, 0, 0.66, -0.04, 0, Math.PI / 2);

  // Harness belt: diagonal chest strap + buckle (period racing detail).
  add(new BoxGeometry(0.075, 0.42, 0.02), belt, 0.02, 0.5, 0.115, 0.12, 0.6);
  add(new BoxGeometry(0.06, 0.05, 0.025), chrome, -0.05, 0.34, 0.13, 0.12);

  // Neck + head
  add(new CapsuleGeometry(0.06, 0.05, 4, 8), skin, 0, 0.78, -0.03);
  add(new SphereGeometry(0.13, 18, 14), skin, 0, 0.9, -0.01);
  // Ears
  add(new SphereGeometry(0.028, 8, 6), skin, -0.125, 0.9, -0.02);
  add(new SphereGeometry(0.028, 8, 6), skin, 0.125, 0.9, -0.02);
  // Sunglasses: lens bar + thin temple arms
  add(new BoxGeometry(0.2, 0.05, 0.04), dark, 0, 0.91, 0.1);
  add(new BoxGeometry(0.02, 0.014, 0.12), dark, -0.1, 0.91, 0.045);
  add(new BoxGeometry(0.02, 0.014, 0.12), dark, 0.1, 0.91, 0.045);

  // Scarf (woman, flying softly back) / collar (man).
  if (woman) {
    add(new TorusGeometry(0.085, 0.028, 8, 14), accent, 0, 0.8, -0.02, Math.PI / 2);
    add(new CapsuleGeometry(0.035, 0.3, 4, 8), accent, -0.08, 0.72, -0.2, 1.35, 0.25);
  } else {
    add(new TorusGeometry(0.085, 0.024, 8, 14), accent, 0, 0.79, -0.02, Math.PI / 2);
  }

  // Hair
  if (woman) {
    add(new SphereGeometry(0.135, 16, 12), hair, 0, 0.94, -0.04);
    add(new CapsuleGeometry(0.1, 0.22, 4, 8), hair, 0, 0.78, -0.14); // ponytail down back
    add(new TorusGeometry(0.05, 0.015, 6, 10), accent, 0, 0.87, -0.13, 0.5); // hairband
  } else {
    add(new SphereGeometry(0.135, 16, 12), hair, 0, 0.95, -0.05); // short cap
    add(new BoxGeometry(0.04, 0.08, 0.02), hair, -0.125, 0.87, -0.03); // sideburns
    add(new BoxGeometry(0.04, 0.08, 0.02), hair, 0.125, 0.87, -0.03);
  }

  // Arms: upper + forearm reaching to the wheel, gloved hands.
  for (const sx of [-1, 1]) {
    add(new CapsuleGeometry(0.055, 0.22, 4, 8), suit, sx * 0.2, 0.58, 0.0, 0.4); // upper arm
    add(new CapsuleGeometry(0.05, 0.26, 4, 8), suit, sx * 0.16, 0.46, 0.22, 1.1); // forearm fwd
    add(new SphereGeometry(0.06, 10, 8), glove, sx * 0.13, 0.42, 0.36); // leather glove
    add(new TorusGeometry(0.052, 0.012, 6, 10), glove, sx * 0.145, 0.435, 0.3, 1.1); // cuff
  }
  // Wristwatch on the left wrist — tiny chrome band.
  add(new TorusGeometry(0.05, 0.012, 6, 12), chrome, 0.15, 0.445, 0.28, 1.1);

  // Thighs forward under the dash
  add(new CapsuleGeometry(0.09, 0.26, 4, 8), suit, -0.1, 0.2, 0.18, 1.2);
  add(new CapsuleGeometry(0.09, 0.26, 4, 8), suit, 0.1, 0.2, 0.18, 1.2);

  return g;
}
