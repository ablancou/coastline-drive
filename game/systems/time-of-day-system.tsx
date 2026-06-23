"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import {
  DAY_LENGTH_SECONDS,
  computeSky,
  makeSkyState,
  timeOfDay,
} from "@/game/systems/time-of-day";
import { useRaceStore } from "@/stores/race-store";
import { useSceneStore } from "@/stores/scene-store";

/** Advances the time of day during play and flips the night flag at dawn/dusk
 * (which swaps the HDRI). Continuous lighting is applied by SkySetup. */
export function TimeOfDaySystem() {
  const sky = useMemo(() => makeSkyState(), []);

  useFrame((_, dt) => {
    const race = useRaceStore.getState();
    if (race.started && !race.paused && !race.finished) {
      timeOfDay.value = (timeOfDay.value + dt / DAY_LENGTH_SECONDS) % 1;
    }
    computeSky(timeOfDay.value, sky);
    const scene = useSceneStore.getState();
    if (sky.night !== scene.night) scene.setNight(sky.night);
  });

  return null;
}
