"use client";

import { useMemo } from "react";
import { buildPalms } from "@/game/procedural/geometry/palms";

/** Procedural palm trees scattered on the land side of the circuit. */
export function Palms({ count = 34 }: { count?: number }) {
  const group = useMemo(() => buildPalms(count), [count]);
  return <primitive object={group} />;
}
