"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { SPAWN_T } from "@/game/constants/spawn";
import { getRoadProgress } from "@/game/procedural/geometry/road-path";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";
import { useSceneStore } from "@/stores/scene-store";

/**
 * Lap timing: tracks the car's normalized progress along the circuit and counts
 * a lap when it crosses the start/finish line (SPAWN_T) in the forward
 * direction — but only after passing the far side, so jitter at the line and
 * reversing can't trigger a false lap.
 */
export function LapSystem() {
  const prevAround = useRef<number | null>(null);
  const armed = useRef(false);

  useFrame(() => {
    if (!vehicleTarget.active) return;
    const race = useRaceStore.getState();
    if (!race.started || race.paused || race.finished) return;

    const pos = vehicleTarget.position;
    const t = getRoadProgress(pos.x, pos.z);
    // Progress measured from the finish line (0 at the line, →1 around the lap).
    const around = (t - SPAWN_T + 1) % 1;

    if (prevAround.current === null) {
      // Timing is started by the countdown's GO; just seed progress here.
      prevAround.current = around;
      return;
    }

    // Arm once the car has driven past the far half of the circuit.
    if (around > 0.5) armed.current = true;

    // Forward crossing of the finish line: progress wraps from ~1 back to ~0.
    if (armed.current && prevAround.current > 0.9 && around < 0.1) {
      const idx = useSceneStore.getState().skyIndex;
      const trackId = SKY_PRESETS[idx % SKY_PRESETS.length]?.id ?? "unknown";
      useLapStore.getState().completeLap(performance.now(), trackId);
      armed.current = false;

      // Race finish: target laps reached.
      const target = race.targetLaps;
      if (target > 0 && useLapStore.getState().lapCount >= target) {
        useRaceStore.getState().setFinished(true);
      }
    }

    prevAround.current = around;
  });

  return null;
}
