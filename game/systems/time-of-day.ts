import { Color } from "three";

/** Continuous time of day, 0..1 (0 = midnight, 0.25 = sunrise, 0.5 = noon,
 * 0.75 = sunset). Mutated by TimeOfDaySystem, read imperatively by the sky. */
export const timeOfDay = { value: 0.42 };

/** Seconds for a full day → noticeable shift within ~2 minutes of play. */
export const DAY_LENGTH_SECONDS = 480;

export interface SkyState {
  /** Sun elevation -1..1 (>0 daytime). */
  sunElev: number;
  night: boolean;
  sunIntensity: number;
  sunColor: Color;
  sunX: number;
  sunY: number;
  sunZ: number;
  exposure: number;
  fog: Color;
  hemiIntensity: number;
  hemiSky: Color;
  envIntensity: number;
}

const _sunColor = new Color();
const _fog = new Color();
const _hemiSky = new Color();
const _c1 = new Color();
const _c2 = new Color();

const DAY_FOG = new Color("#cfe0ec");
const SUNSET_FOG = new Color("#e0935a");
const NIGHT_FOG = new Color("#0a1224");
const WARM_LOW = new Color("#ff8a40");
const WARM_HIGH = new Color("#fff1d0");
const MOON = new Color("#9fb6ff");

/** Derive all sky/lighting values from a time-of-day value (0..1). */
export function computeSky(t: number, out: SkyState): SkyState {
  const sunElev = Math.sin(((t - 0.25) / 0.5) * Math.PI); // -1..1
  const day = Math.max(0, sunElev);
  const horizon = Math.max(0, 1 - Math.abs(sunElev) * 3); // warm glow near dawn/dusk
  const night = sunElev < -0.06;

  out.sunElev = sunElev;
  out.night = night;

  // Sun color: warm at the horizon → warm-white at noon; moonlight at night.
  _c1.copy(WARM_LOW).lerp(WARM_HIGH, day);
  out.sunColor = night ? _sunColor.copy(MOON) : _sunColor.copy(_c1);
  out.sunIntensity = night ? 0.45 : 0.35 + day * 3.0;

  const angle = t * Math.PI * 2;
  out.sunX = Math.cos(angle) * 160;
  out.sunZ = Math.sin(angle) * 130;
  out.sunY = 40 + day * 180;

  out.exposure = night ? 0.55 : 0.72 + day * 0.48;

  // Fog: day blue → warm at horizon; dark blue at night.
  _c2.copy(DAY_FOG).lerp(SUNSET_FOG, horizon);
  out.fog = night ? _fog.copy(NIGHT_FOG) : _fog.copy(_c2);

  out.hemiIntensity = night ? 0.28 : 0.3 + day * 0.15;
  out.hemiSky = night ? _hemiSky.set("#34406a") : _hemiSky.set("#dcecff");
  out.envIntensity = night ? 0.5 : 0.7 + day * 0.6;

  return out;
}

export function makeSkyState(): SkyState {
  return {
    sunElev: 0,
    night: false,
    sunIntensity: 3,
    sunColor: new Color("#ffffff"),
    sunX: 120,
    sunY: 110,
    sunZ: 80,
    exposure: 1.1,
    fog: new Color("#cfe0ec"),
    hemiIntensity: 0.35,
    hemiSky: new Color("#dcecff"),
    envIntensity: 1.1,
  };
}
