import { create } from "zustand";

export type DriverVariant = "man" | "woman";

/** Car customization (model + paint + driver). Read by the scene, set by the UI. */
interface CustomizationStore {
  carId: string;
  carColor: string;
  wheelColor: string;
  driver: DriverVariant;
  setCarId: (id: string) => void;
  setCarColor: (hex: string) => void;
  setWheelColor: (hex: string) => void;
  setDriver: (driver: DriverVariant) => void;
}

export const useCustomizationStore = create<CustomizationStore>((set) => ({
  carId: "spyder55",
  carColor: "#b10f1a",
  wheelColor: "#c9ced6",
  driver: "man",
  setCarId: (id) => set({ carId: id }),
  setCarColor: (hex) => set({ carColor: hex }),
  setWheelColor: (hex) => set({ wheelColor: hex }),
  setDriver: (driver) => set({ driver }),
}));
