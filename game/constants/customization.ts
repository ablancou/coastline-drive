/** Player-selectable car paint colors. */
export interface CarColor {
  id: string;
  label: string;
  hex: string;
}

export const CAR_COLORS: CarColor[] = [
  { id: "red", label: "Rojo", hex: "#b10f1a" },
  { id: "blue", label: "Azul", hex: "#1b3f8f" },
  { id: "black", label: "Negro", hex: "#0e1116" },
  { id: "gray", label: "Gris", hex: "#9aa1aa" },
  { id: "white", label: "Blanco", hex: "#e7e9ee" },
  { id: "green", label: "Verde", hex: "#0f5a3c" },
  { id: "gold", label: "Oro", hex: "#c79a3a" },
  { id: "orange", label: "Naranja", hex: "#d8631a" },
  { id: "teal", label: "Turquesa", hex: "#0f8a8a" },
  { id: "purple", label: "Púrpura", hex: "#5b2a86" },
  { id: "ivory", label: "Marfil", hex: "#ece3cf" },
  { id: "racing", label: "Racing", hex: "#1f9e57" },
];

/** Rim (wheel) colors. */
export const WHEEL_COLORS: CarColor[] = [
  { id: "silver", label: "Plata", hex: "#c9ced6" },
  { id: "graphite", label: "Grafito", hex: "#3a3e44" },
  { id: "gold", label: "Oro", hex: "#c79a3a" },
  { id: "bronze", label: "Bronce", hex: "#9c6b3f" },
  { id: "white", label: "Blanco", hex: "#e7e9ee" },
];
