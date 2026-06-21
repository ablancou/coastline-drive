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
    id: "spyder55",
    name: "Spyder 55",
    tagline: "Roadster ligero de competición",
    lengthScale: 1.0,
    heightScale: 1.0,
    width: 1.62,
    fairing: "twin",
    screenHeight: 0.12,
  },
  {
    id: "speedster56",
    name: "Speedster 56",
    tagline: "Clásico curvo descapotable",
    lengthScale: 0.93,
    heightScale: 1.12,
    width: 1.66,
    fairing: "none",
    screenHeight: 0.1,
  },
  {
    id: "speedster89",
    name: "Speedster 89",
    tagline: "Neo-clásico abierto",
    lengthScale: 1.06,
    heightScale: 0.95,
    width: 1.76,
    fairing: "double",
    screenHeight: 0.16,
  },
];

export const DEFAULT_CAR_ID = CAR_DESIGNS[0]!.id;

export function getCarDesign(id: string): CarDesign {
  return CAR_DESIGNS.find((c) => c.id === id) ?? CAR_DESIGNS[0]!;
}
