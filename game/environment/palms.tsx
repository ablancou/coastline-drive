"use client";

import { useMemo } from "react";
import { buildPalms } from "@/game/procedural/geometry/palms";

/** Procedural palm trees scattered on the land side of the circuit. */
export function Palms() {
  const group = useMemo(() => buildPalms(), []);
  return <primitive object={group} />;
}
