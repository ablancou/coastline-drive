import { create } from "zustand";

export type DriverVariant = "man" | "woman";
export type DogSize = "chico" | "grande";

/** Car customization (model + paint + driver + dogs). Read by the scene, set by the UI. */
interface CustomizationStore {
  carId: string;
  carColor: string;
  wheelColor: string;
  driver: DriverVariant;
  /** Companion dogs riding along: 0–5 (first rides shotgun, rest on the deck). */
  dogCount: number;
  dogColor: string;
  dogSize: DogSize;
  setCarId: (id: string) => void;
  setCarColor: (hex: string) => void;
  setWheelColor: (hex: string) => void;
  setDriver: (driver: DriverVariant) => void;
  setDogCount: (n: number) => void;
  setDogColor: (hex: string) => void;
  setDogSize: (size: DogSize) => void;
}

export const useCustomizationStore = create<CustomizationStore>((set) => ({
  carId: "spyder55",
  carColor: "#b10f1a",
  wheelColor: "#c9ced6",
  driver: "man",
  dogCount: 0,
  dogColor: "#c98d4e",
  dogSize: "chico",
  setCarId: (id) => set({ carId: id }),
  setCarColor: (hex) => set({ carColor: hex }),
  setWheelColor: (hex) => set({ wheelColor: hex }),
  setDriver: (driver) => set({ driver }),
  setDogCount: (n) => set({ dogCount: Math.max(0, Math.min(5, Math.round(n))) }),
  setDogColor: (hex) => set({ dogColor: hex }),
  setDogSize: (size) => set({ dogSize: size }),
}));
