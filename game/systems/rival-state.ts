/** A car's shared world slot: XZ for player collision, plus road-space
 * progress (t) and lane offset so AI cars can keep distance from each other. */
export interface CarSlot {
  x: number;
  z: number;
  t: number;
  lane: number;
}

/** Rival world slots, written by Rivals, read by the player controller for
 * soft collision and by the separation logic. */
export const rivalPositions: CarSlot[] = [];

/** Same for ambient traffic — slower cars sharing the player's direction. */
export const trafficPositions: CarSlot[] = [];
