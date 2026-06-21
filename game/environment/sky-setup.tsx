"use client";

import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { useSceneStore } from "@/stores/scene-store";

const NIGHT_HDRI = "/assets/third-party/hdri/dikhololo_night_2k.hdr";

/**
 * Coastal sky + IBL from CC0 HDRIs, with a real day/night toggle. Day uses the
 * destination's HDRI; night swaps to a shared starlit sky, dims the key light to
 * moonlight, cools the fog and lowers exposure — making the headlights matter.
 */
export function SkySetup() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const night = useSceneStore((s) => s.night);
  const preset = SKY_PRESETS[skyIndex % SKY_PRESETS.length] ?? SKY_PRESETS[0]!;
  const { gl, scene } = useThree();

  useEffect(() => {
    scene.backgroundRotation.set(0, preset.rotationY, 0);
    scene.environmentRotation.set(0, preset.rotationY, 0);
  }, [scene, preset]);

  // Lower exposure at night for a moonlit mood.
  useEffect(() => {
    gl.toneMappingExposure = night ? 0.62 : 1.15;
  }, [gl, night]);

  const sunny = preset.sunny && !night;

  return (
    <>
      <color attach="background" args={[night ? "#0a1020" : "#bcd9ef"]} />

      <Environment
        key={night ? "night" : preset.id}
        files={night ? NIGHT_HDRI : preset.file}
        background
        backgroundBlurriness={0}
        backgroundIntensity={night ? 0.7 : preset.backgroundIntensity}
        environmentIntensity={night ? 0.5 : preset.environmentIntensity}
      />

      <hemisphereLight
        args={night ? ["#34406a", "#0a0e18", 0.3] : ["#fff4e0", "#3b3026", sunny ? 0.4 : 0.25]}
      />

      {/* Key light: warm sun by day, cool moonlight by night. */}
      <directionalLight
        position={night ? [-60, 80, -40] : [120, 110, 80]}
        intensity={night ? 0.5 : sunny ? 3.4 : 2.3}
        color={night ? "#9fb8ff" : sunny ? "#fff0c4" : "#fff1d6"}
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

      <fog
        attach="fog"
        args={night ? ["#0a1224", 200, 720] : [sunny ? "#dcecff" : "#cfe0ec", 340, 940]}
      />
    </>
  );
}
