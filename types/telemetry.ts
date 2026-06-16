/** HUD-facing snapshot — updated at 5–10 Hz, never per-frame. */
export interface TelemetrySnapshot {
  speedKmh: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  inputSource: "gamepad" | "keyboard" | "none";
}

export const INITIAL_TELEMETRY: TelemetrySnapshot = {
  speedKmh: 0,
  rpm: 800,
  gear: 1,
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: false,
  inputSource: "none",
};