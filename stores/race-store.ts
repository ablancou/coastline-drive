import { create } from "zustand";

/** Race/session state: lap target, pause and finished flags. */
interface RaceStore {
  /** Target laps for a race; 0 = free roam (no finish). */
  targetLaps: number;
  paused: boolean;
  finished: boolean;
  setTargetLaps: (n: number) => void;
  setPaused: (v: boolean) => void;
  togglePaused: () => void;
  setFinished: (v: boolean) => void;
  /** Reset run state for a fresh start (keeps the chosen lap target). */
  resetRun: () => void;
}

export const useRaceStore = create<RaceStore>((set) => ({
  targetLaps: 0,
  paused: false,
  finished: false,
  setTargetLaps: (n) => set({ targetLaps: Math.max(0, n) }),
  setPaused: (v) => set({ paused: v }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setFinished: (v) => set({ finished: v }),
  resetRun: () => set({ paused: false, finished: false }),
}));
