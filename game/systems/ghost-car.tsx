"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { getChassisRestHeightAboveRoad } from "@/game/constants/spawn";
import { VEHICLE_CONFIG } from "@/game/constants/vehicle";
import { createCarBody } from "@/game/procedural/geometry/car-designs";
import {
  type GhostData,
  type GhostPose,
  loadGhost,
  sampleGhost,
} from "@/game/systems/ghost";
import { useCustomizationStore } from "@/stores/customization-store";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";
import { useSceneStore } from "@/stores/scene-store";

/**
 * Your best run on this track, replayed as a translucent blue ghost car you
 * race side by side. Purely visual — no collision, no physics; it just samples
 * the stored lap at the current run time.
 */
export function GhostCar() {
  const skyIndex = useSceneStore((s) => s.skyIndex);
  const trackId = SKY_PRESETS[skyIndex % SKY_PRESETS.length]?.id ?? "unknown";
  const carId = useCustomizationStore((s) => s.carId);
  const runId = useRaceStore((s) => s.runId);
  const ghostEnabled = useRaceStore((s) => s.ghostEnabled);

  const restHeight = useMemo(() => getChassisRestHeightAboveRoad(), []);
  const [ghost, setGhost] = useState<GhostData | null>(null);
  const cursor = useRef({ i: 0 });
  const pose = useRef<GhostPose>({ x: 0, z: 0, yaw: 0, running: false });

  // Reload the stored ghost whenever a fresh run starts (it may have just been
  // overwritten by a new personal best).
  useEffect(() => {
    setGhost(loadGhost(trackId));
    cursor.current.i = 0;
  }, [trackId, runId]);

  const root = useMemo(() => {
    const g = new Object3D();
    const body = createCarBody(carId, "#7fd4ff", false);
    // Turn the whole car into a translucent hologram.
    body.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.material = new MeshBasicMaterial({
        color: 0x7fd4ff,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      });
    });
    g.add(body);

    const wheelGeo = new CylinderGeometry(0.36, 0.36, 0.3, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new MeshStandardMaterial({
      color: 0x2a5f7a,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const wheelY =
      VEHICLE_CONFIG.wheels[0]!.position[1] - VEHICLE_CONFIG.suspension.restLength;
    for (const w of VEHICLE_CONFIG.wheels) {
      const wheel = new Mesh(wheelGeo, wheelMat);
      wheel.position.set(w.position[0], wheelY, w.position[2]);
      g.add(wheel);
    }
    g.visible = false;
    return g;
  }, [carId]);

  useFrame(() => {
    const race = useRaceStore.getState();
    const lap = useLapStore.getState();
    const live = race.started && !race.paused && !race.finished;

    if (!ghost || !ghostEnabled || !live || !lap.timing) {
      root.visible = false;
      return;
    }

    const elapsed = performance.now() - lap.lapStartPerf;
    const p = sampleGhost(ghost, elapsed, pose.current, cursor.current);
    root.visible = true;
    root.position.set(p.x, restHeight, p.z);
    root.rotation.y = p.yaw;
  });

  return <primitive object={root} />;
}
