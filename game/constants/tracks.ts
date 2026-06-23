/**
 * One unique circuit per destination. Everything (road, terrain, cliffs,
 * guardrails, colliders, spawn, minimap, rivals) is generated procedurally from
 * the active track's closed-loop control points, so each destination drives a
 * genuinely different layout. All share ROAD_WIDTH / ROAD_SEGMENTS / SPAWN_T.
 *
 * Loops are kept star-convex (angle-ordered) so the Catmull-Rom spline never
 * self-intersects.
 */
export interface Track {
  id: string;
  name: string;
  /** Closed-loop control points [x, z] (road surface y is fixed). */
  points: [number, number][];
}

export const TRACKS: Track[] = [
  {
    // Acapulco: crescent bay + long SE coastal straight (Zona Diamante).
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
    id: "cancun",
    name: "Cancún · Isla",
    points: [
      [150, 0],
      [119, 69],
      [59, 103],
      [0, 112],
      [-59, 103],
      [-119, 69],
      [-150, 0],
      [-119, -69],
      [-59, -103],
      [0, -112],
      [59, -103],
      [119, -69],
    ],
  },
  {
    id: "los_cabos",
    name: "Los Cabos · El Arco",
    points: [
      [140, 0],
      [122, 59],
      [79, 99],
      [27, 118],
      [-27, 118],
      [-79, 99],
      [-122, 59],
      [-140, 0],
      [-122, -59],
      [-79, -99],
      [-40, -176],
      [40, -176],
      [79, -99],
      [122, -59],
    ],
  },
  {
    id: "tulum",
    name: "Tulum · Riviera Maya",
    points: [
      [120, 0],
      [112, 59],
      [83, 120],
      [20, 163],
      [-55, 146],
      [-101, 89],
      [-118, 29],
      [-118, -29],
      [-101, -89],
      [-55, -146],
      [20, -163],
      [83, -120],
      [112, -59],
    ],
  },
  {
    id: "niza",
    name: "Niza · Promenade",
    points: [
      [148, 0],
      [133, 77],
      [67, 116],
      [0, 118],
      [-58, 100],
      [-110, 64],
      [-148, 0],
      [-133, -77],
      [-67, -116],
      [0, -118],
      [58, -100],
      [110, -64],
    ],
  },
  {
    id: "monaco",
    name: "Mónaco · Circuito",
    points: [
      [95, 0],
      [105, 51],
      [65, 82],
      [17, 76],
      [-17, 76],
      [-65, 82],
      [-105, 51],
      [-95, 0],
      [-66, -32],
      [-53, -67],
      [-25, -109],
      [25, -109],
      [53, -67],
      [66, -32],
    ],
  },
  {
    id: "costa_azul",
    name: "Costa Azul · Corniche",
    points: [
      [125, 0],
      [135, 65],
      [92, 115],
      [26, 116],
      [-22, 95],
      [-67, 84],
      [-124, 60],
      [-153, 0],
      [-124, -60],
      [-67, -84],
      [-22, -95],
      [26, -116],
      [92, -115],
      [135, -65],
    ],
  },
  {
    id: "positano",
    name: "Positano · Switchbacks",
    points: [
      [110, 0],
      [129, 54],
      [78, 78],
      [31, 74],
      [0, 110],
      [-54, 129],
      [-78, 78],
      [-74, 31],
      [-110, 0],
      [-129, -54],
      [-78, -78],
      [-31, -74],
      [0, -110],
      [54, -129],
      [78, -78],
      [74, -31],
    ],
  },
  {
    id: "amalfi",
    name: "Amalfi · Costiera",
    points: [
      [140, 0],
      [132, 64],
      [74, 93],
      [22, 98],
      [-27, 117],
      [-92, 115],
      [-126, 61],
      [-110, 0],
      [-93, -45],
      [-82, -102],
      [-33, -145],
      [29, -127],
      [64, -81],
      [100, -48],
    ],
  },
  {
    id: "portofino",
    name: "Portofino · Bahía",
    points: [
      [108, 0],
      [83, 44],
      [43, 63],
      [10, 86],
      [-38, 99],
      [-76, 67],
      [-78, 19],
      [-78, -19],
      [-76, -67],
      [-38, -99],
      [10, -86],
      [43, -63],
      [83, -44],
    ],
  },
];

export const DEFAULT_TRACK = TRACKS[0]!;

export function getTrack(id: string): Track {
  return TRACKS.find((t) => t.id === id) ?? DEFAULT_TRACK;
}
