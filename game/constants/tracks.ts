/**
 * One unique OPEN coastal road per destination (point-to-point, not a loop).
 * The car drives from start to finish with the sea always on one side. Roads
 * run roughly along Z with an X wiggle for character; everything (road, terrain,
 * cliffs, guardrails, colliders, spawn, minimap, rivals) is generated from the
 * active road's control points. All share ROAD_WIDTH / ROAD_SEGMENTS / SPAWN_T.
 */
export interface Track {
  id: string;
  name: string;
  /** Open control points [x, z] from start to finish (road surface y is fixed). */
  points: [number, number][];
}

/**
 * Distance the whole coastal road is stretched along Z. The base control-point
 * tables below were authored across z ∈ [-250, 250]; this scale lengthens the
 * drive (the curve gets correspondingly longer) without re-authoring points.
 * Keep terrain depth / shadow-camera / ocean coverage in sync with TRACK_HALF_Z.
 */
export const TRACK_LENGTH_SCALE = 1.85;
/** Half the Z-extent of a road after scaling (≈ base 250 × scale). */
export const TRACK_HALF_Z = 250 * TRACK_LENGTH_SCALE;

const BASE_TRACKS: Track[] = [
  { id: "acapulco", name: "Acapulco · Zona Diamante", points: [[-10, -250], [-33, -221], [-52, -191], [-65, -162], [-70, -132], [-66, -103], [-54, -74], [-35, -44], [-12, -15], [12, 15], [35, 44], [54, 74], [66, 103], [70, 132], [65, 162], [52, 191], [33, 221], [10, 250]] },
  { id: "cancun", name: "Cancún · Costera", points: [[-26, -250], [-25, -221], [-24, -191], [-20, -162], [-16, -132], [-11, -103], [-5, -74], [1, -44], [7, -15], [13, 15], [18, 44], [22, 74], [24, 103], [26, 132], [26, 162], [24, 191], [22, 221], [18, 250]] },
  { id: "los_cabos", name: "Los Cabos · Corredor", points: [[-13, -250], [-53, -221], [-81, -191], [-92, -162], [-83, -132], [-55, -103], [-16, -74], [27, -44], [64, -15], [87, 15], [91, 44], [76, 74], [44, 103], [2, 132], [-40, 162], [-73, 191], [-90, 221], [-88, 250]] },
  { id: "tulum", name: "Tulum · Riviera Maya", points: [[-31, -250], [-38, -221], [-42, -191], [-42, -162], [-38, -132], [-31, -103], [-21, -74], [-10, -44], [2, -15], [14, 15], [25, 44], [34, 74], [40, 103], [42, 132], [41, 162], [36, 191], [28, 221], [18, 250]] },
  { id: "niza", name: "Niza · Promenade", points: [[-29, -250], [-48, -221], [-59, -191], [-62, -162], [-56, -132], [-42, -103], [-22, -74], [2, -44], [25, -15], [44, 15], [57, 44], [62, 74], [58, 103], [45, 132], [26, 162], [3, 191], [-20, 221], [-40, 250]] },
  { id: "monaco", name: "Mónaco · Costa", points: [[59, -250], [83, -221], [73, -191], [34, -162], [-19, -132], [-65, -103], [-84, -74], [-69, -44], [-27, -15], [27, 15], [69, 44], [84, 74], [65, 103], [19, 132], [-34, 162], [-73, 191], [-83, 221], [-59, 250]] },
  { id: "costa_azul", name: "Costa Azul · Corniche", points: [[51, -250], [3, -221], [-46, -191], [-82, -162], [-96, -132], [-83, -103], [-48, -74], [1, -44], [49, -15], [84, 15], [96, 44], [82, 74], [45, 103], [-4, 132], [-52, 162], [-86, 191], [-96, 221], [-80, 250]] },
  { id: "positano", name: "Positano · Amalfitana", points: [[-45, -250], [44, -221], [104, -191], [97, -162], [29, -132], [-58, -103], [-108, -74], [-89, -44], [-12, -15], [72, 15], [110, 44], [78, 74], [-4, 103], [-84, 132], [-109, 162], [-65, 191], [21, 221], [94, 250]] },
  { id: "amalfi", name: "Amalfi · Costiera", points: [[55, -250], [6, -221], [-45, -191], [-80, -162], [-89, -132], [-68, -103], [-24, -74], [28, -44], [71, -15], [90, 15], [78, 44], [41, 74], [-11, 103], [-58, 132], [-87, 162], [-86, 191], [-56, 221], [-7, 250]] },
  { id: "portofino", name: "Portofino · Litoral", points: [[51, -250], [72, -221], [58, -191], [17, -162], [-32, -132], [-66, -103], [-69, -74], [-38, -44], [11, -15], [54, 15], [72, 44], [55, 74], [12, 103], [-37, 132], [-68, 162], [-67, 191], [-34, 221], [15, 250]] },
];

/**
 * Stretch the authored roads along Z so each drive is meaningfully longer.
 * X is scaled a touch too (so curves keep their proportions instead of looking
 * pinched), but less than Z so the road still runs mostly seaward-parallel.
 */
export const TRACKS: Track[] = BASE_TRACKS.map((t) => ({
  ...t,
  points: t.points.map(([x, z]) => [
    Math.round(x * 1.25 * 100) / 100,
    Math.round(z * TRACK_LENGTH_SCALE * 100) / 100,
  ]) as [number, number][],
}));

export const DEFAULT_TRACK = TRACKS[0]!;

export function getTrack(id: string): Track {
  return TRACKS.find((t) => t.id === id) ?? DEFAULT_TRACK;
}
