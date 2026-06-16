import { MeshStandardMaterial } from "three";

/** Simple ocean material — Fresnel-like via low roughness + blue base. */
export function createOceanMaterial(): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: 0x1a5c7a,
    metalness: 0.15,
    roughness: 0.08,
    transparent: true,
    opacity: 0.92,
  });
}