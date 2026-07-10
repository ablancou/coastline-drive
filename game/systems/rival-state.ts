/** Shared rival world positions (XZ), written by Rivals, read by the player
 * controller for soft collision. */
export const rivalPositions: { x: number; z: number }[] = [];

/** Same idea for ambient traffic — slower cars sharing the player's direction.
 * Written by Traffic, read by the player controller so they're solid, not
 * ghosts. */
export const trafficPositions: { x: number; z: number }[] = [];
