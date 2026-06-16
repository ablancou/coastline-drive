"use client";

import { Environment } from "@react-three/drei";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { useSceneStore } from "@/stores/scene-store";

/**
 * Real coastal sky + image-based lighting from CC0 Poly Haven HDRIs.
 * The HDRI provides BOTH the visible sky background and the reflections on the
 * car. The active preset is chosen in the scene store and can be cycled live
 * with the "N" key (see components/game/sky-switcher). Presets are defined in
 * game/constants/sky-presets and licensed in ASSET_MANIFEST.json.
 */
export function SkySetup() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const preset = SKY_PRESETS[skyIndex % SKY_PRESETS.length] ?? SKY_PRESETS[0]!;

  return (
    <>
      {/* Sky-blue fallback shown only while an HDRI streams in. */}
      <color attach="background" args={["#bcd9ef"]} />

      <Environment
        key={preset.id}
        files={preset.file}
        background
        backgroundBlurriness={0}
        backgroundIntensity={preset.backgroundIntensity}
        environmentIntensity={preset.environmentIntensity}
      />

      {/* Soft sky/ground bounce to lift shadow areas. */}
      <hemisphereLight args={["#dcecff", "#3b3026", 0.25]} />

      {/* Warm key sun — the single shadow caster. Aligned to a golden-hour feel. */}
      <directionalLight
        position={[80, 55, 60]}
        intensity={2.4}
        color="#fff1d6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={320}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-bias={-0.0004}
      />

      <fog attach="fog" args={["#cfe0ec", 200, 520]} />
    </>
  );
}
