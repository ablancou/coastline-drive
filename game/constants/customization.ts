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
];
