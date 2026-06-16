/**
 * Coastal sky presets — CC0 Poly Haven HDRIs that *evoke* famous beaches.
 * These are licensed stock skies chosen to match each location's mood, not
 * literal photos of those places. Sources tracked in ASSET_MANIFEST.json.
 *
 * Cycle them live in-game with the "N" key (see components/game/sky-switcher).
 */
export interface SkyPreset {
  id: string;
  /** Friendly label shown in-game (inspiration noted). */
  label: string;
  /** Path under /public. */
  file: string;
  environmentIntensity: number;
  backgroundIntensity: number;
}

const HDRI_DIR = "/assets/third-party/hdri";

export const SKY_PRESETS: SkyPreset[] = [
  {
    id: "secluded_beach",
    label: "Acapulco · atardecer",
    file: `${HDRI_DIR}/secluded_beach_2k.hdr`,
    environmentIntensity: 1.3,
    backgroundIntensity: 1.15,
  },
  {
    id: "blue_lagoon",
    label: "Cancún · turquesa tropical",
    file: `${HDRI_DIR}/blue_lagoon_2k.hdr`,
    environmentIntensity: 1.2,
    backgroundIntensity: 1.05,
  },
  {
    id: "fish_hoek_beach",
    label: "Los Cabos · costa abierta",
    file: `${HDRI_DIR}/fish_hoek_beach_2k.hdr`,
    environmentIntensity: 1.1,
    backgroundIntensity: 1.0,
  },
  {
    id: "venice_sunset",
    label: "Niza · atardecer Riviera",
    file: `${HDRI_DIR}/venice_sunset_2k.hdr`,
    environmentIntensity: 1.15,
    backgroundIntensity: 1.0,
  },
  {
    id: "cloudy_cliffside_road",
    label: "Positano · acantilado",
    file: `${HDRI_DIR}/cloudy_cliffside_road_2k.hdr`,
    environmentIntensity: 1.2,
    backgroundIntensity: 1.05,
  },
  {
    id: "blouberg_sunrise_1",
    label: "Portofino · amanecer",
    file: `${HDRI_DIR}/blouberg_sunrise_1_2k.hdr`,
    environmentIntensity: 1.15,
    backgroundIntensity: 1.0,
  },
];
