import { create } from "zustand";

/** Race/session state: lap target, pause and finished flags. */
interface RaceStore {
  /** Target laps for a race; 0 = free roam (no finish). */
  targetLaps: number;
  paused: boolean;
  finished: boolean;
  /** False during the 3-2-1 countdown; true once racing. */
  started: boolean;
  /** Live standing. */
  position: number;
  totalRacers: number;
  setTargetLaps: (n: number) => void;
  setPaused: (v: boolean) => void;
  togglePaused: () => void;
  setFinished: (v: boolean) => void;
  setStarted: (v: boolean) => void;
  setStanding: (position: number, totalRacers: number) => void;
  /** Reset run state for a fresh start (keeps the chosen lap target). */
  resetRun: () => void;
}

export const useRaceStore = create<RaceStore>((set) => ({
  targetLaps: 0,
  paused: false,
  finished: false,
  started: false,
  position: 1,
  totalRacers: 1,
  setTargetLaps: (n) => set({ targetLaps: Math.max(0, n) }),
  setPaused: (v) => set({ paused: v }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setFinished: (v) => set({ finished: v }),
  setStarted: (v) => set({ started: v }),
  setStanding: (position, totalRacers) => set({ position, totalRacers }),
  resetRun: () => set({ paused: false, finished: false, started: false, position: 1 }),
}));
