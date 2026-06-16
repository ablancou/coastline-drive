import { create } from "zustand";

/** Scene presentation state (sky selection). Written by UI, read by the scene. */
interface SceneStore {
  skyIndex: number;
  nextSky: (total: number) => void;
  setSky: (index: number) => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  skyIndex: 0,
  nextSky: (total) =>
    set((state) => ({ skyIndex: total > 0 ? (state.skyIndex + 1) % total : 0 })),
  setSky: (index) => set({ skyIndex: Math.max(0, index) }),
}));
