"use client";

import { Fragment } from "react";
import { PostFx } from "@/components/game/post-fx";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { getTrack } from "@/game/constants/tracks";
import { CoastalScene } from "@/game/environment/coastal-scene";
import { SkySetup } from "@/game/environment/sky-setup";
import { PhysicsWorld } from "@/game/physics/physics-world";
import { setActiveTrack } from "@/game/procedural/geometry/road-path";
import { CameraBootstrap } from "@/game/systems/camera-bootstrap";
import { ChaseCamera } from "@/game/systems/chase-camera";
import { DriftEffects } from "@/game/systems/drift-effects";
import { EngineAudioSystem } from "@/game/systems/engine-audio-system";
import { Headlights } from "@/game/systems/headlights";
import { LapSystem } from "@/game/systems/lap-system";
import { Rivals } from "@/game/systems/rivals";
import { VehicleController } from "@/game/vehicles/vehicle-controller";
import { useSceneStore } from "@/stores/scene-store";

/** Full 3D scene — rendering, physics, and simulation live exclusively here. */
export function GameScene() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const trackId = SKY_PRESETS[skyIndex % SKY_PRESETS.length]?.trackId ?? "stadium";

  // Make the active circuit current BEFORE the keyed subtree builds its geometry.
  setActiveTrack(getTrack(trackId));

  return (
    <>
      <SkySetup />
      <EngineAudioSystem />
      <Headlights />
      <PostFx />

      {/* Track-dependent world — remounts (rebuilds geometry, colliders, spawn,
          camera, rivals, lap state) whenever the destination's track changes. */}
      <Fragment key={trackId}>
        <CameraBootstrap />
        <ChaseCamera />
        <CoastalScene />
        <Rivals />
        <PhysicsWorld>
          <VehicleController />
        </PhysicsWorld>
        <LapSystem />
        <DriftEffects />
      </Fragment>
    </>
  );
}
