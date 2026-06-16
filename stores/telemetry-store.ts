import { create } from "zustand";
import { finiteOr } from "@/lib/math";
import {
  INITIAL_TELEMETRY,
  type TelemetrySnapshot,
} from "@/types/telemetry";

interface TelemetryStore {
  snapshot: TelemetrySnapshot;
  setSnapshot: (partial: Partial<TelemetrySnapshot>) => void;
}

function sanitizeTelemetry(
  current: TelemetrySnapshot,
  partial: Partial<TelemetrySnapshot>,
): TelemetrySnapshot {
  const merged = { ...current, ...partial };

  return {
    speedKmh: finiteOr(merged.speedKmh, 0),
    rpm: finiteOr(merged.rpm, INITIAL_TELEMETRY.rpm),
    gear: Math.max(1, Math.round(finiteOr(merged.gear, 1))),
    throttle: finiteOr(merged.throttle, 0),
    brake: finiteOr(merged.brake, 0),
    steer: finiteOr(merged.steer, 0),
    handbrake: Boolean(merged.handbrake),
    inputSource:
      merged.inputSource === "gamepad" ||
      merged.inputSource === "keyboard" ||
      merged.inputSource === "none"
        ? merged.inputSource
        : "none",
  };
}

/** HUD-only store. Written from useFrame via getState(); read by React UI. */
export const useTelemetryStore = create<TelemetryStore>((set) => ({
  snapshot: INITIAL_TELEMETRY,
  setSnapshot: (partial) =>
    set((state) => ({
      snapshot: sanitizeTelemetry(state.snapshot, partial),
    })),
}));