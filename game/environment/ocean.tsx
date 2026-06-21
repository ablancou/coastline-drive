"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { createOceanMaterial } from "@/game/procedural/materials/ocean";

/** Animated ocean plane — advances the wave shader time each frame. */
export function Ocean() {
  const material = useMemo(() => createOceanMaterial(), []);

  useFrame((_, dt) => {
    const u = material.userData.uTime as { value: number } | undefined;
    if (u) u.value += dt;
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -1.5, 0]} material={material} receiveShadow>
      <planeGeometry args={[1600, 1600, 160, 160]} />
    </mesh>
  );
}
