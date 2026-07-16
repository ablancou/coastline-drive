"use client";

import { Environment } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  type DirectionalLight,
  Fog,
  type HemisphereLight,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { getActiveTrack } from "@/game/procedural/geometry/road-path";
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
  const sunDisc = useRef<Mesh>(null);
  const sunGlow = useRef<Mesh>(null);
  const sky = useMemo(() => makeSkyState(), []);
  const camera = useThree((s) => s.camera);

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
      // Keep the shadow frustum centered on the car (≈ camera ground focus) so
      // shadows stay crisp along the whole long coastal road instead of fading
      // out past a fixed box at the world origin.
      const fx = camera.position.x;
      const fz = camera.position.z;
      // Hang the sun over the WATER side of this destination — golden glints on
      // the open sea (e.g. Acapulco: sea + sun on the right of the drive).
      const seaX = getActiveTrack().seaXdir;
      s.position.set(fx + Math.abs(sky.sunX) * seaX, sky.sunY, fz + sky.sunZ);
      s.target.position.set(fx, 0, fz);
      s.target.updateMatrixWorld();
    }
    if (hemi.current) {
      hemi.current.intensity = sky.hemiIntensity;
      hemi.current.color.copy(sky.hemiSky);
    }

    // Visible sun disc + glow, hung far out over the OPEN SEA at the horizon so
    // it comes into view as the road bends seaward. Follows the camera in XZ; a
    // touch of forward bias keeps it "al fondo". Hidden at night.
    const disc = sunDisc.current;
    const glow = sunGlow.current;
    if (disc && glow) {
      const day = Math.max(0, sky.sunElev);
      const visible = !sky.night && day > 0.02;
      disc.visible = visible;
      glow.visible = visible;
      if (visible) {
        const seaX = getActiveTrack().seaXdir;
        const D = 1700;
        // Mostly seaward, a little forward (+Z), elevation rising toward noon.
        const dx = seaX * 0.86;
        const dz = 0.34;
        const dy = 0.16 + day * 0.42;
        const inv = D / Math.hypot(dx, dy, dz);
        const px = camera.position.x + dx * inv;
        const py = dy * inv;
        const pz = camera.position.z + dz * inv;
        disc.position.set(px, py, pz);
        glow.position.set(px, py, pz);
        disc.lookAt(camera.position);
        glow.lookAt(camera.position);
        const warm = 0.5 + day * 0.5;
        (disc.material as MeshBasicMaterial).color.setRGB(
          1,
          0.82 + warm * 0.15,
          0.6 + warm * 0.3,
        );
      }
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

      {/* Sun disc + soft halo — bright, unlit, so bloom wraps it in glow. */}
      <mesh ref={sunDisc} scale={70}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial color="#fff2cc" toneMapped={false} fog={false} />
      </mesh>
      <mesh ref={sunGlow} scale={230}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial
          color="#ffd27a"
          transparent
          opacity={0.32}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={700}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0004}
      />
    </>
  );
}
