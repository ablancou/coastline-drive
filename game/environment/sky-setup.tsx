"use client";

import { Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type DirectionalLight, Fog, type HemisphereLight } from "three";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { computeSky, makeSkyState, timeOfDay } from "@/game/systems/time-of-day";
import { useSceneStore } from "@/stores/scene-store";

const NIGHT_HDRI = "/assets/third-party/hdri/dikhololo_night_2k.hdr";

/**
 * Real coastal sky with a continuous day/night cycle. The HDRI swaps between the
 * destination's day sky and a shared night sky at dawn/dusk; the sun colour,
 * intensity, position, exposure and fog all animate smoothly from the time of day.
 */
export function SkySetup() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const night = useSceneStore((s) => s.night);
  const preset = SKY_PRESETS[skyIndex % SKY_PRESETS.length] ?? SKY_PRESETS[0]!;
  const { gl, scene } = useThree();

  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const sky = useMemo(() => makeSkyState(), []);

  useEffect(() => {
    scene.backgroundRotation.set(0, preset.rotationY, 0);
    scene.environmentRotation.set(0, preset.rotationY, 0);
  }, [scene, preset]);

  useEffect(() => {
    if (!scene.fog) scene.fog = new Fog("#cfe0ec", 340, 940);
  }, [scene]);

  useFrame(() => {
    computeSky(timeOfDay.value, sky);
    const s = sun.current;
    if (s) {
      s.intensity = sky.sunIntensity;
      s.color.copy(sky.sunColor);
      s.position.set(sky.sunX, sky.sunY, sky.sunZ);
    }
    if (hemi.current) {
      hemi.current.intensity = sky.hemiIntensity;
      hemi.current.color.copy(sky.hemiSky);
    }
    gl.toneMappingExposure = sky.exposure;
    const fog = scene.fog as Fog | null;
    if (fog) {
      fog.color.copy(sky.fog);
      fog.near = sky.night ? 220 : 340;
      fog.far = sky.night ? 760 : 940;
    }
  });

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

      <hemisphereLight ref={hemi} args={["#dcecff", "#2a2620", 0.32]} />

      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={700}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={260}
        shadow-camera-bottom={-260}
        shadow-bias={-0.0004}
      />
    </>
  );
}
