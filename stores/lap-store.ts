import { create } from "zustand";

const STORAGE_KEY = "coastline-drive:bestByTrack";
const SPLITS_KEY = "coastline-drive:bestSplits";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
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
  /** Persistent best cumulative split times (ms) per destination id. */
  bestSplitsByTrack: Record<string, number[]>;
  /** Splits recorded so far in the current run. */
  runSplits: number[];
  /** Most recent split delta vs. best (ms; negative = faster). */
  splitDelta: number | null;
  /** Which sector the delta belongs to, and when it was set (for HUD fade). */
  splitIndex: number;
  splitShownAt: number;
  startTiming: (perf: number) => void;
  /** Record a sector crossing; computes the delta vs the stored best. */
  recordSplit: (index: number, elapsedMs: number, trackId: string) => void;
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
  bestByTrack: loadJSON<Record<string, number>>(STORAGE_KEY, {}),
  bestSplitsByTrack: loadJSON<Record<string, number[]>>(SPLITS_KEY, {}),
  runSplits: [],
  splitDelta: null,
  splitIndex: -1,
  splitShownAt: 0,
  startTiming: (perf) =>
    set({
      lapStartPerf: perf,
      timing: true,
      runSplits: [],
      splitDelta: null,
      splitIndex: -1,
    }),
  recordSplit: (index, elapsedMs, trackId) =>
    set((state) => {
      if (state.runSplits.length !== index) return state; // out of order — ignore
      const best = state.bestSplitsByTrack[trackId];
      const ref = best?.[index];
      return {
        runSplits: [...state.runSplits, elapsedMs],
        splitDelta: ref == null ? null : elapsedMs - ref,
        splitIndex: index,
        splitShownAt: performance.now(),
      };
    }),
  completeLap: (perf, trackId) =>
    set((state) => {
      const ms = perf - state.lapStartPerf;
      const prev = state.bestByTrack[trackId];
      const isBest = prev == null || ms < prev;

      const bestByTrack = isBest ? { ...state.bestByTrack, [trackId]: ms } : state.bestByTrack;
      if (isBest) saveJSON(STORAGE_KEY, bestByTrack);

      // Splits from the best run become the reference for future attempts.
      let bestSplitsByTrack = state.bestSplitsByTrack;
      if (isBest && state.runSplits.length > 0) {
        bestSplitsByTrack = { ...bestSplitsByTrack, [trackId]: state.runSplits };
        saveJSON(SPLITS_KEY, bestSplitsByTrack);
      }

      return {
        lapStartPerf: perf,
        timing: false,
        lastLapMs: ms,
        bestLapMs: state.bestLapMs == null ? ms : Math.min(state.bestLapMs, ms),
        lapCount: state.lapCount + 1,
        raceTotalMs: state.raceTotalMs + ms,
        bestByTrack,
        bestSplitsByTrack,
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
      runSplits: [],
      splitDelta: null,
      splitIndex: -1,
    }),
}));
