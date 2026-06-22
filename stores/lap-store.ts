import { create } from "zustand";

const STORAGE_KEY = "coastline-drive:bestByTrack";

function loadBest(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveBest(data: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** Lap timing state. Written by the in-canvas lap system, read by the HUD. */
interface LapStore {
  lapStartPerf: number;
  timing: boolean;
  lastLapMs: number | null;
  bestLapMs: number | null;
  lapCount: number;
  /** Sum of completed lap times this run. */
  raceTotalMs: number;
  /** Persistent best lap per destination id. */
  bestByTrack: Record<string, number>;
  startTiming: (perf: number) => void;
  completeLap: (perf: number, trackId: string) => void;
  reset: () => void;
}

export const useLapStore = create<LapStore>((set) => ({
  lapStartPerf: 0,
  timing: false,
  lastLapMs: null,
  bestLapMs: null,
  lapCount: 0,
  raceTotalMs: 0,
  bestByTrack: loadBest(),
  startTiming: (perf) => set({ lapStartPerf: perf, timing: true }),
  completeLap: (perf, trackId) =>
    set((state) => {
      const ms = perf - state.lapStartPerf;
      const prev = state.bestByTrack[trackId];
      const bestByTrack =
        prev == null || ms < prev ? { ...state.bestByTrack, [trackId]: ms } : state.bestByTrack;
      if (bestByTrack !== state.bestByTrack) saveBest(bestByTrack);
      return {
        lapStartPerf: perf,
        timing: true,
        lastLapMs: ms,
        bestLapMs: state.bestLapMs == null ? ms : Math.min(state.bestLapMs, ms),
        lapCount: state.lapCount + 1,
        raceTotalMs: state.raceTotalMs + ms,
        bestByTrack,
      };
    }),
  reset: () =>
    set({
      lapStartPerf: 0,
      timing: false,
      lastLapMs: null,
      bestLapMs: null,
      lapCount: 0,
      raceTotalMs: 0,
    }),
}));
