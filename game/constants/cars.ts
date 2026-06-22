/**
 * Car lineup — ORIGINAL roadsters inspired by classic silhouettes (no brand
 * names, badges or exact copies → license-free and commercial-safe). Geometry
 * is generated procedurally in car-designs.ts from these parameters.
 */
export type FairingStyle = "twin" | "none" | "double";

export interface CarDesign {
  id: string;
  name: string;
  tagline: string;
  /** Shell length/height scale (relative to the base extruded profile). */
  lengthScale: number;
  heightScale: number;
  /** Body width (extrusion depth). */
  width: number;
  /** Rear deck treatment. */
  fairing: FairingStyle;
  /** Windscreen frame height. */
  screenHeight: number;
}

export const CAR_DESIGNS: CarDesign[] = [
  {
    // Inspired by the 550 Spyder: lowest + slimmest, single headrest fairing.
    id: "spyder55",
    name: "Spyder 55",
    tagline: "Roadster ligero de competición",
    lengthScale: 1.0,
    heightScale: 0.92,
    width: 1.58,
    fairing: "twin",
    screenHeight: 0.1,
  },
  {
    // Inspired by the 356 Speedster: rounder "bathtub", shorter, taller cabin.
    id: "speedster56",
    name: "Speedster 56",
    tagline: "Clásico curvo descapotable",
    lengthScale: 0.9,
    heightScale: 1.16,
    width: 1.68,
    fairing: "none",
    screenHeight: 0.13,
  },
  {
    // Inspired by the '89 911 Speedster: wider + longer + aggressive, double-bubble.
    id: "speedster89",
    name: "Speedster 89",
    tagline: "Neo-clásico abierto",
    lengthScale: 1.08,
    heightScale: 1.0,
    width: 1.84,
    fairing: "double",
    screenHeight: 0.15,
  },
];

export const DEFAULT_CAR_ID = CAR_DESIGNS[0]!.id;

export function getCarDesign(id: string): CarDesign {
  return CAR_DESIGNS.find((c) => c.id === id) ?? CAR_DESIGNS[0]!;
}
