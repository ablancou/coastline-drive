"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Color } from "three";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { createOceanMaterial } from "@/game/procedural/materials/ocean";
import { useSceneStore } from "@/stores/scene-store";

/**
 * Per-destination water tint so each location reads differently up close.
 * Tuned toward bright, paradisiacal turquoise for the tropical spots and deep
 * Mediterranean azure for the European ones.
 */
const WATER_BY_ID: Record<string, string> = {
  acapulco: "#1ba6b0",
  cancun: "#19c5d6",
  los_cabos: "#1d86b8",
  tulum: "#1ec7b4",
  niza: "#1f8fc4",
  monaco: "#1c7fbe",
  costa_azul: "#22a0cc",
  positano: "#1c84b6",
  amalfi: "#1aa6c4",
  portofino: "#1f8fc4",
};

const _color = new Color();

export function Ocean() {
  const material = useMemo(() => createOceanMaterial(), []);
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const night = useSceneStore((s) => s.night);

  const preset = SKY_PRESETS[skyIndex % SKY_PRESETS.length] ?? SKY_PRESETS[0]!;
  _color.set(WATER_BY_ID[preset.id] ?? "#1f6f9e");
  if (night) _color.multiplyScalar(0.32);
  material.color.copy(_color);

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
