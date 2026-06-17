/**
 * Coastal destinations — CC0 Poly Haven HDRIs that *evoke* famous beaches and
 * rivieras. These are licensed stock skies chosen to match each location's mood,
 * not literal photos of those places. Sources tracked in ASSET_MANIFEST.json.
 *
 * Each preset is both the sky background and the IBL reflections. In the Garage
 * the player picks a destination; "N" also cycles them live in-game.
 */
export interface SkyPreset {
  id: string;
  /** Friendly label shown in-game (inspiration noted). */
  label: string;
  region: "México" | "Europa";
  /** Path under /public. */
  file: string;
  environmentIntensity: number;
  backgroundIntensity: number;
}

const HDRI_DIR = "/assets/third-party/hdri";

export const SKY_PRESETS: SkyPreset[] = [
  // --- México ---
  {
    id: "acapulco",
    label: "Acapulco · atardecer",
    region: "México",
    file: `${HDRI_DIR}/secluded_beach_2k.hdr`,
    environmentIntensity: 1.3,
    backgroundIntensity: 1.15,
  },
  {
    id: "cancun",
    label: "Cancún · turquesa",
    region: "México",
    file: `${HDRI_DIR}/blue_lagoon_2k.hdr`,
    environmentIntensity: 1.2,
    backgroundIntensity: 1.05,
  },
  {
    id: "los_cabos",
    label: "Los Cabos · costa",
    region: "México",
    file: `${HDRI_DIR}/fish_hoek_beach_2k.hdr`,
    environmentIntensity: 1.1,
    backgroundIntensity: 1.0,
  },
  {
    id: "tulum",
    label: "Tulum · amanecer",
    region: "México",
    file: `${HDRI_DIR}/umhlanga_sunrise_2k.hdr`,
    environmentIntensity: 1.2,
    backgroundIntensity: 1.05,
  },
  // --- Europa ---
  {
    id: "niza",
    label: "Niza · Riviera",
    region: "Europa",
    file: `${HDRI_DIR}/venice_sunset_2k.hdr`,
    environmentIntensity: 1.15,
    backgroundIntensity: 1.0,
  },
  {
    id: "monaco",
    label: "Mónaco · marina",
    region: "Europa",
    file: `${HDRI_DIR}/petit_port_2k.hdr`,
    environmentIntensity: 1.15,
    backgroundIntensity: 1.05,
  },
  {
    id: "costa_azul",
    label: "Costa Azul · mirador",
    region: "Europa",
    file: `${HDRI_DIR}/dalkey_view_2k.hdr`,
    environmentIntensity: 1.15,
    backgroundIntensity: 1.0,
  },
  {
    id: "positano",
    label: "Positano · acantilado",
    region: "Europa",
    file: `${HDRI_DIR}/cloudy_cliffside_road_2k.hdr`,
    environmentIntensity: 1.2,
    backgroundIntensity: 1.05,
  },
  {
    id: "amalfi",
    label: "Amalfi · Italia",
    region: "Europa",
    file: `${HDRI_DIR}/spiaggia_di_mondello_2k.hdr`,
    environmentIntensity: 1.2,
    backgroundIntensity: 1.05,
  },
  {
    id: "portofino",
    label: "Portofino · amanecer",
    region: "Europa",
    file: `${HDRI_DIR}/blouberg_sunrise_1_2k.hdr`,
    environmentIntensity: 1.15,
    backgroundIntensity: 1.0,
  },
];
