"use client";

import { useFrame } from "@react-three/fiber";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { getRoadProgress } from "@/game/procedural/geometry/road-path";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";
import { useSceneStore } from "@/stores/scene-store";

const FINISH_T = 0.985;

/**
 * Sprint timing on the open coastal road: records the A→B time and finishes the
 * run when the car reaches the end of the road.
 */
export function LapSystem() {
  useFrame(() => {
    if (!vehicleTarget.active) return;
    const race = useRaceStore.getState();
    if (!race.started || race.paused || race.finished) return;

    const pos = vehicleTarget.position;
    const t = getRoadProgress(pos.x, pos.z);

    if (t >= FINISH_T) {
      const idx = useSceneStore.getState().skyIndex;
      const trackId = SKY_PRESETS[idx % SKY_PRESETS.length]?.id ?? "unknown";
      useLapStore.getState().completeLap(performance.now(), trackId);
      useRaceStore.getState().setFinished(true);
    }
  });

  return null;
}
