"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import type { Biome } from "@/game/constants/biomes";
import { buildFoliage } from "@/game/procedural/geometry/foliage";

/**
 * Biome-appropriate vegetation (palms / cacti / cypress) along the circuit.
 * Each plant sways gently in the sea breeze — pure rotation, no allocations.
 * Cacti barely move (rigid); palms/cypress get the full sway.
 */
export function Foliage({ biome }: { biome: Biome }) {
  const group = useMemo(() => buildFoliage(biome), [biome]);
  const ref = useRef<Group>(null);
  const amp = biome.id === "arid" ? 0.006 : 0.022;

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const children = g.children; // flat group — each child is one plant
    for (let i = 0; i < children.length; i++) {
      const plant = children[i]!;
      plant.rotation.z = Math.sin(t * 0.9 + i * 1.7) * amp;
      plant.rotation.x = Math.sin(t * 0.63 + i * 2.3) * amp * 0.6;
    }
  });

  return <primitive ref={ref} object={group} />;
}
