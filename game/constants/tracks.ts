/**
 * Track layouts. Everything (road, terrain, cliffs, guardrails, colliders,
 * spawn, minimap, rivals) is generated procedurally from the active track's
 * spline points, so adding a track is just adding a closed loop of [x, z]
 * control points here. All tracks share ROAD_WIDTH / ROAD_SEGMENTS / SPAWN_T.
 */
export interface Track {
  id: string;
  name: string;
  /** Closed-loop control points [x, z] (road surface y is fixed). */
  points: [number, number][];
}

export const TRACKS: Track[] = [
  {
    id: "stadium",
    name: "Gran Bahía",
    points: [
      [120, -170],
      [120, -60],
      [120, 60],
      [120, 160],
      [80, 205],
      [0, 215],
      [-80, 205],
      [-120, 160],
      [-120, 60],
      [-120, -60],
      [-120, -170],
      [-80, -210],
      [-10, -218],
      [70, -205],
    ],
  },
  {
    id: "bay",
    name: "Caleta",
    points: [
      [-100, 20],
      [-60, 85],
      [10, 105],
      [80, 80],
      [115, 20],
      [110, -55],
      [55, -100],
      [-25, -105],
      [-90, -65],
      [-115, -15],
    ],
  },
  {
    // Acapulco: a crescent bay with a long SE coastal straight (Zona Diamante /
    // Bulevar de las Naciones) and a sweeping return past the bay (Caleta side).
    id: "acapulco",
    name: "Acapulco · Zona Diamante",
    points: [
      [-135, -30],
      [-120, 45],
      [-90, 100],
      [-20, 122],
      [60, 100],
      [120, 52],
      [142, -30],
      [120, -120],
      [60, -172],
      [-30, -162],
      [-100, -102],
    ],
  },
  {
    id: "cliffs",
    name: "Acantilados",
    points: [
      [120, -130],
      [135, -30],
      [95, 55],
      [125, 145],
      [45, 175],
      [-45, 160],
      [-125, 100],
      [-95, 5],
      [-135, -85],
      [-55, -155],
      [45, -165],
      [105, -135],
    ],
  },
];

export const DEFAULT_TRACK = TRACKS[0]!;

export function getTrack(id: string): Track {
  return TRACKS.find((t) => t.id === id) ?? DEFAULT_TRACK;
}
