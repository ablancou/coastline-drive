"use client";

import { useMemo } from "react";
import type { Biome } from "@/game/constants/biomes";
import { buildFoliage } from "@/game/procedural/geometry/foliage";

/** Biome-appropriate vegetation (palms / cacti / cypress) along the circuit. */
export function Foliage({ biome }: { biome: Biome }) {
  const group = useMemo(() => buildFoliage(biome), [biome]);
  return <primitive object={group} />;
}
