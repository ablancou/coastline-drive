/** HUD-facing snapshot — updated at 5–10 Hz, never per-frame. */
export interface TelemetrySnapshot {
  speedKmh: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  /** Nitro charge 0..1. */
  nitro: number;
  inputSource: "gamepad" | "keyboard" | "touch" | "none";
}

export const INITIAL_TELEMETRY: TelemetrySnapshot = {
  speedKmh: 0,
  rpm: 800,
  gear: 1,
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: false,
  nitro: 1,
  inputSource: "none",
};