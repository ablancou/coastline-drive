"use client";

import { useMemo } from "react";
import { buildBuildings } from "@/game/procedural/geometry/buildings";

/** Coastal city / marina skyline for urban destinations. */
export function Buildings() {
  const group = useMemo(() => buildBuildings(), []);
  return <primitive object={group} />;
}
