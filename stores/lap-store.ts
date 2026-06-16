import { create } from "zustand";

/** Lap timing state. Written by the in-canvas lap system, read by the HUD. */
interface LapStore {
  /** performance.now() (ms) when the current lap started. */
  lapStartPerf: number;
  /** Whether a lap is currently being timed. */
  timing: boolean;
  lastLapMs: number | null;
  bestLapMs: number | null;
  /** Completed laps. */
  lapCount: number;
  startTiming: (perf: number) => void;
  completeLap: (perf: number) => void;
  reset: () => void;
}

export const useLapStore = create<LapStore>((set) => ({
  lapStartPerf: 0,
  timing: false,
  lastLapMs: null,
  bestLapMs: null,
  lapCount: 0,
  startTiming: (perf) => set({ lapStartPerf: perf, timing: true }),
  completeLap: (perf) =>
    set((state) => {
      const ms = perf - state.lapStartPerf;
      return {
        lapStartPerf: perf,
        timing: true,
        lastLapMs: ms,
        bestLapMs: state.bestLapMs == null ? ms : Math.min(state.bestLapMs, ms),
        lapCount: state.lapCount + 1,
      };
    }),
  reset: () =>
    set({ lapStartPerf: 0, timing: false, lastLapMs: null, bestLapMs: null, lapCount: 0 }),
}));
