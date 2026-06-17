"use client";

import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { useSceneStore } from "@/stores/scene-store";

/**
 * Real coastal sky + image-based lighting from CC0 Poly Haven HDRIs.
 * Active preset chosen in the scene store (Garage / "N" key). The sky is rotated
 * per-preset so the sea lands correctly, and sunny destinations get a warmer,
 * stronger key light for a hot, bright feel.
 */
export function SkySetup() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const preset = SKY_PRESETS[skyIndex % SKY_PRESETS.length] ?? SKY_PRESETS[0]!;
  const { scene } = useThree();

  // Rotate sky + IBL so each destination's sea is oriented correctly.
  useEffect(() => {
    scene.backgroundRotation.set(0, preset.rotationY, 0);
    scene.environmentRotation.set(0, preset.rotationY, 0);
  }, [scene, preset]);

  const sunny = preset.sunny;

  return (
    <>
      <color attach="background" args={["#bcd9ef"]} />

      <Environment
        key={preset.id}
        files={preset.file}
        background
        backgroundBlurriness={0}
        backgroundIntensity={preset.backgroundIntensity}
        environmentIntensity={preset.environmentIntensity}
      />

      <hemisphereLight args={["#fff4e0", "#3b3026", sunny ? 0.4 : 0.25]} />

      {/* Warm key sun — hotter + stronger on sunny days. */}
      <directionalLight
        position={[120, 110, 80]}
        intensity={sunny ? 3.4 : 2.3}
        color={sunny ? "#fff0c4" : "#fff1d6"}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={700}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={260}
        shadow-camera-bottom={-260}
        shadow-bias={-0.0004}
      />

      <fog attach="fog" args={[sunny ? "#dcecff" : "#cfe0ec", 340, 940]} />
    </>
  );
}
