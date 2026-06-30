/**
 * One unique coastal location per destination. Unlike the old road-relative
 * model, each location now has a FIXED geographic coastline (the shoreline) plus
 * a drivable road that mostly hugs that coast — with the sea always looking out
 * to one side — and occasionally swings inland through city blocks before
 * returning to the seafront. Terrain, beach and ocean are generated from the
 * coastline; the car drives the road. The two are authored from a compact spec
 * so every destination feels distinct without hand-placing hundreds of points.
 */
export interface Track {
  id: string;
  name: string;
  /** Drivable road control points [x, z], start → finish (y is fixed). */
  points: [number, number][];
  /** Fixed shoreline control points [x, z] (land/sea boundary). */
  coast: [number, number][];
  /**
   * World-X direction the open sea lies, relative to the coastline:
   * -1 = sea toward −X (to the car's right when driving +Z),
   * +1 = sea toward +X (to the car's left). Flip if a location's sea
   * ends up on the wrong side.
   */
  seaXdir: number;
}

/** Half the Z-extent of every location (road + coastline run along Z). */
export const TRACK_HALF_Z = 460;

interface CoastSpec {
  id: string;
  name: string;
  /** Which side of the car the sea is on while driving start→finish (+Z). */
  sea: "right" | "left";
  /** Base world-X of the shoreline. */
  coastBaseX: number;
  /** Shoreline wave amplitude + frequency + phase (gives the coast character). */
  coastAmp: number;
  coastFreq: number;
  coastPhase: number;
  /** Linear X drift of the coast start→finish (overall bend of the coastline). */
  drift: number;
  /** Base distance the road sits inland from the shore. */
  inland: number;
  /** Small independent road wander so it isn't a perfect offset of the coast. */
  roadWiggle: number;
  /** Inland excursions (city blocks): a Gaussian bump pulling the road inland. */
  detours: { z: number; w: number; depth: number }[];
}

// Per-destination character. Acapulco: sea on the right, a long coastal sweep
// bending left, with a city detour through the Zona Diamante. Mónaco: mirrored —
// sea on the left, the principality (city) on the right, tight and wavy.
const SPECS: CoastSpec[] = [
  { id: "acapulco", name: "Acapulco · Zona Diamante", sea: "right", coastBaseX: -40, coastAmp: 24, coastFreq: 0.0085, coastPhase: 0.4, drift: 70, inland: 16, roadWiggle: 7, detours: [{ z: 40, w: 95, depth: 64 }] },
  { id: "cancun", name: "Cancún · Costera", sea: "right", coastBaseX: -30, coastAmp: 12, coastFreq: 0.006, coastPhase: 0, drift: 30, inland: 14, roadWiggle: 4, detours: [{ z: -120, w: 80, depth: 40 }] },
  { id: "los_cabos", name: "Los Cabos · Corredor", sea: "right", coastBaseX: -55, coastAmp: 46, coastFreq: 0.011, coastPhase: 1.1, drift: -40, inland: 18, roadWiggle: 9, detours: [] },
  { id: "tulum", name: "Tulum · Riviera Maya", sea: "right", coastBaseX: -34, coastAmp: 20, coastFreq: 0.009, coastPhase: 0.6, drift: 24, inland: 13, roadWiggle: 5, detours: [{ z: 110, w: 70, depth: 34 }] },
  { id: "niza", name: "Niza · Promenade", sea: "right", coastBaseX: -38, coastAmp: 30, coastFreq: 0.012, coastPhase: 0.2, drift: 48, inland: 17, roadWiggle: 6, detours: [{ z: -40, w: 85, depth: 50 }] },
  { id: "monaco", name: "Mónaco · Costa", sea: "left", coastBaseX: 46, coastAmp: 34, coastFreq: 0.016, coastPhase: 0.9, drift: -30, inland: 16, roadWiggle: 8, detours: [{ z: 20, w: 75, depth: 56 }] },
  { id: "costa_azul", name: "Costa Azul · Corniche", sea: "left", coastBaseX: 52, coastAmp: 40, coastFreq: 0.013, coastPhase: 0.3, drift: -50, inland: 19, roadWiggle: 9, detours: [] },
  { id: "positano", name: "Positano · Amalfitana", sea: "left", coastBaseX: 50, coastAmp: 52, coastFreq: 0.017, coastPhase: 1.4, drift: 36, inland: 18, roadWiggle: 11, detours: [{ z: -60, w: 70, depth: 48 }] },
  { id: "amalfi", name: "Amalfi · Costiera", sea: "left", coastBaseX: 48, coastAmp: 44, coastFreq: 0.015, coastPhase: 0.7, drift: -36, inland: 17, roadWiggle: 10, detours: [{ z: 80, w: 72, depth: 44 }] },
  { id: "portofino", name: "Portofino · Litoral", sea: "left", coastBaseX: 44, coastAmp: 30, coastFreq: 0.018, coastPhase: 0.1, drift: 28, inland: 15, roadWiggle: 7, detours: [{ z: -20, w: 65, depth: 40 }] },
];

const N_ROAD = 30;
const N_COAST = 22;
const r2 = (v: number) => Math.round(v * 100) / 100;

function coastXAt(s: CoastSpec, z: number): number {
  return (
    s.coastBaseX +
    s.coastAmp * Math.sin(z * s.coastFreq + s.coastPhase) +
    s.drift * (z / TRACK_HALF_Z)
  );
}

function roadInlandAt(s: CoastSpec, z: number): number {
  let d = s.inland + s.roadWiggle * Math.sin(z * 0.012 + 1.7);
  for (const dt of s.detours) {
    const u = (z - dt.z) / dt.w;
    d += dt.depth * Math.exp(-u * u);
  }
  return d;
}

function buildTrack(s: CoastSpec): Track {
  const seaXdir = s.sea === "right" ? -1 : 1;
  const landDir = -seaXdir; // road sits on the land side of the coast

  const coast: [number, number][] = [];
  for (let i = 0; i < N_COAST; i++) {
    const z = -TRACK_HALF_Z + (2 * TRACK_HALF_Z * i) / (N_COAST - 1);
    coast.push([r2(coastXAt(s, z)), r2(z)]);
  }

  const points: [number, number][] = [];
  for (let i = 0; i < N_ROAD; i++) {
    const z = -TRACK_HALF_Z + (2 * TRACK_HALF_Z * i) / (N_ROAD - 1);
    const x = coastXAt(s, z) + landDir * roadInlandAt(s, z);
    points.push([r2(x), r2(z)]);
  }

  return { id: s.id, name: s.name, points, coast, seaXdir };
}

export const TRACKS: Track[] = SPECS.map(buildTrack);

export const DEFAULT_TRACK = TRACKS[0]!;

export function getTrack(id: string): Track {
  return TRACKS.find((t) => t.id === id) ?? DEFAULT_TRACK;
}
