import { create } from "zustand";

export type DriverVariant = "man" | "woman";

/** Car customization (paint color + driver). Read by the scene, set by the UI. */
interface CustomizationStore {
  carColor: string;
  driver: DriverVariant;
  setCarColor: (hex: string) => void;
  setDriver: (driver: DriverVariant) => void;
}

export const useCustomizationStore = create<CustomizationStore>((set) => ({
  carColor: "#b10f1a",
  driver: "man",
  setCarColor: (hex) => set({ carColor: hex }),
  setDriver: (driver) => set({ driver }),
}));
