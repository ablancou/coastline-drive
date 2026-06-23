"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Color } from "three";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { createOceanMaterial } from "@/game/procedural/materials/ocean";
import { useSceneStore } from "@/stores/scene-store";

/** Per-destination water tint so each location reads differently up close. */
const WATER_BY_ID: Record<string, string> = {
  acapulco: "#2a7a86",
  cancun: "#15a8bf",
  los_cabos: "#1c5f86",
  tulum: "#16a89e",
  niza: "#1f6f9e",
  monaco: "#1a5e8e",
  costa_azul: "#1f86ac",
  positano: "#1c5a7a",
  amalfi: "#1a8aa4",
  portofino: "#1f6f9e",
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
