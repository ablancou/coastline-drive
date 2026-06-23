/** Per-destination biome — drives terrain colours and vegetation density. */
export interface Biome {
  id: string;
  /** Inland grass/vegetation base colour (r,g,b 0..1). */
  grass: [number, number, number];
  /** Cliff/rock colour. */
  rock: [number, number, number];
  /** Beach/sand colour (ocean shoulder). */
  sand: [number, number, number];
  /** Palm tree count. */
  palms: number;
}

const TROPICAL: Biome = {
  id: "tropical",
  grass: [0.22, 0.46, 0.2],
  rock: [0.4, 0.38, 0.32],
  sand: [0.78, 0.72, 0.52],
  palms: 42,
};

const ARID: Biome = {
  id: "arid",
  grass: [0.55, 0.45, 0.28],
  rock: [0.5, 0.4, 0.3],
  sand: [0.82, 0.72, 0.5],
  palms: 10,
};

const MEDITERRANEAN: Biome = {
  id: "mediterranean",
  grass: [0.34, 0.4, 0.24],
  rock: [0.52, 0.5, 0.46],
  sand: [0.72, 0.68, 0.56],
  palms: 18,
};

/** Destination id → biome. */
const BIOME_BY_DEST: Record<string, Biome> = {
  acapulco: TROPICAL,
  cancun: TROPICAL,
  los_cabos: ARID,
  tulum: TROPICAL,
  niza: MEDITERRANEAN,
  monaco: MEDITERRANEAN,
  costa_azul: MEDITERRANEAN,
  positano: MEDITERRANEAN,
  amalfi: TROPICAL,
  portofino: MEDITERRANEAN,
};

export function getBiome(destId: string): Biome {
  return BIOME_BY_DEST[destId] ?? TROPICAL;
}
