"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ACESFilmicToneMapping, Quaternion, Vector3 } from "three";
import { GameScene } from "@/components/game/game-scene";
import { getVehicleSpawnPose } from "@/game/constants/spawn";
import { computeChaseCameraPose } from "@/game/systems/chase-camera-math";

const spawn = getVehicleSpawnPose();
const spawnQuat = new Quaternion().setFromAxisAngle(
  new Vector3(0, 1, 0),
  spawn.rotationY,
);
const initialCamera = computeChaseCameraPose(spawn.position, spawnQuat);

/** R3F Canvas with performance-first configuration. */
export function GameCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop="always"
      performance={{ min: 0.5 }}
      style={{ width: "100%", height: "100%", display: "block" }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      camera={{
        fov: 55,
        near: 0.5,
        far: 1500,
        position: initialCamera.position.toArray(),
      }}
    >
      <Suspense fallback={null}>
        <GameScene />
      </Suspense>
    </Canvas>
  );
}