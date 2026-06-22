import { create } from "zustand";

/** Scene presentation state (sky selection). Written by UI, read by the scene. */
interface SceneStore {
  skyIndex: number;
  headlightsOn: boolean;
  night: boolean;
  hudHidden: boolean;
  nextSky: (total: number) => void;
  setSky: (index: number) => void;
  toggleHeadlights: () => void;
  toggleNight: () => void;
  setNight: (value: boolean) => void;
  toggleHud: () => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  skyIndex: 0,
  headlightsOn: true,
  night: false,
  hudHidden: false,
  nextSky: (total) =>
    set((state) => ({ skyIndex: total > 0 ? (state.skyIndex + 1) % total : 0 })),
  setSky: (index) => set({ skyIndex: Math.max(0, index) }),
  toggleHeadlights: () => set((state) => ({ headlightsOn: !state.headlightsOn })),
  toggleNight: () => set((state) => ({ night: !state.night })),
  setNight: (value) => set({ night: value }),
  toggleHud: () => set((state) => ({ hudHidden: !state.hudHidden })),
}));
