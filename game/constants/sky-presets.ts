/**
 * Coastal destinations — CC0 Poly Haven HDRIs that *evoke* famous beaches and
 * rivieras (not literal photos). Each is both the sky background and the IBL.
 * `rotationY` rotates the sky so the sea lands on the right side of the circuit.
 * Sources tracked in ASSET_MANIFEST.json.
 */
export interface SkyPreset {
  id: string;
  label: string;
  region: "México" | "Europa";
  file: string;
  environmentIntensity: number;
  backgroundIntensity: number;
  /** Sky/IBL Y rotation (radians) to orient the sea correctly. */
  rotationY: number;
  /** Bright sunny daytime scene → warmer, stronger key light. */
  sunny: boolean;
}

const HDRI_DIR = "/assets/third-party/hdri";

export const SKY_PRESETS: SkyPreset[] = [
  // --- México ---
  {
    id: "acapulco",
    label: "Acapulco · atardecer",
    region: "México",
    file: `${HDRI_DIR}/secluded_beach_2k.hdr`,
    environmentIntensity: 1.35,
    backgroundIntensity: 1.2,
    rotationY: Math.PI, // flip so the sea sits on the right
    sunny: false,
  },
  {
    id: "cancun",
    label: "Cancún · turquesa",
    region: "México",
    file: `${HDRI_DIR}/blue_lagoon_2k.hdr`,
    environmentIntensity: 1.4,
    backgroundIntensity: 1.25,
    rotationY: 0,
    sunny: true,
  },
  {
    id: "los_cabos",
    label: "Los Cabos · costa",
    region: "México",
    file: `${HDRI_DIR}/fish_hoek_beach_2k.hdr`,
    environmentIntensity: 1.4,
    backgroundIntensity: 1.25,
    rotationY: 0,
    sunny: true,
  },
  {
    id: "tulum",
    label: "Tulum · mañana",
    region: "México",
    file: `${HDRI_DIR}/umhlanga_sunrise_2k.hdr`,
    environmentIntensity: 1.35,
    backgroundIntensity: 1.2,
    rotationY: 0,
    sunny: true,
  },
  // --- Europa ---
  {
    id: "niza",
    label: "Niza · Riviera",
    region: "Europa",
    file: `${HDRI_DIR}/venice_sunset_2k.hdr`,
    environmentIntensity: 1.15,
    backgroundIntensity: 1.0,
    rotationY: 0,
    sunny: false,
  },
  {
    id: "monaco",
    label: "Mónaco · marina",
    region: "Europa",
    file: `${HDRI_DIR}/petit_port_2k.hdr`,
    environmentIntensity: 1.35,
    backgroundIntensity: 1.2,
    rotationY: 0,
    sunny: true,
  },
  {
    id: "costa_azul",
    label: "Costa Azul · mirador",
    region: "Europa",
    file: `${HDRI_DIR}/dalkey_view_2k.hdr`,
    environmentIntensity: 1.35,
    backgroundIntensity: 1.2,
    rotationY: 0,
    sunny: true,
  },
  {
    id: "positano",
    label: "Positano · acantilado",
    region: "Europa",
    file: `${HDRI_DIR}/cloudy_cliffside_road_2k.hdr`,
    environmentIntensity: 1.2,
    backgroundIntensity: 1.05,
    rotationY: 0,
    sunny: false,
  },
  {
    id: "amalfi",
    label: "Amalfi · Italia",
    region: "Europa",
    file: `${HDRI_DIR}/spiaggia_di_mondello_2k.hdr`,
    environmentIntensity: 1.4,
    backgroundIntensity: 1.25,
    rotationY: 0,
    sunny: true,
  },
  {
    id: "portofino",
    label: "Portofino · mañana",
    region: "Europa",
    file: `${HDRI_DIR}/blouberg_sunrise_1_2k.hdr`,
    environmentIntensity: 1.2,
    backgroundIntensity: 1.05,
    rotationY: 0,
    sunny: false,
  },
];
