import { create } from "zustand";

/** Scene presentation state (sky selection). Written by UI, read by the scene. */
interface SceneStore {
  skyIndex: number;
  headlightsOn: boolean;
  nextSky: (total: number) => void;
  setSky: (index: number) => void;
  toggleHeadlights: () => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  skyIndex: 0,
  headlightsOn: true,
  nextSky: (total) =>
    set((state) => ({ skyIndex: total > 0 ? (state.skyIndex + 1) % total : 0 })),
  setSky: (index) => set({ skyIndex: Math.max(0, index) }),
  toggleHeadlights: () => set((state) => ({ headlightsOn: !state.headlightsOn })),
}));
