"use client";

import { PostFx } from "@/components/game/post-fx";
import { CoastalScene } from "@/game/environment/coastal-scene";
import { SkySetup } from "@/game/environment/sky-setup";
import { PhysicsWorld } from "@/game/physics/physics-world";
import { CameraBootstrap } from "@/game/systems/camera-bootstrap";
import { ChaseCamera } from "@/game/systems/chase-camera";
import { DriftEffects } from "@/game/systems/drift-effects";
import { EngineAudioSystem } from "@/game/systems/engine-audio-system";
import { Headlights } from "@/game/systems/headlights";
import { LapSystem } from "@/game/systems/lap-system";
import { Traffic } from "@/game/systems/traffic";
import { VehicleController } from "@/game/vehicles/vehicle-controller";

/** Full 3D scene — rendering, physics, and simulation live exclusively here. */
export function GameScene() {
  return (
    <>
      <SkySetup />
      <CameraBootstrap />
      <ChaseCamera />
      <CoastalScene />
      <Traffic />
      <PhysicsWorld>
        <VehicleController />
      </PhysicsWorld>
      <EngineAudioSystem />
      <LapSystem />
      <DriftEffects />
      <Headlights />
      <PostFx />
    </>
  );
}