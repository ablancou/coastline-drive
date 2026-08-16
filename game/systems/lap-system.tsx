"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { SKY_PRESETS } from "@/game/constants/sky-presets";
import { playFinishFanfare } from "@/game/procedural/audio/engine-audio";
import { getRoadProgress } from "@/game/procedural/geometry/road-path";
import {
  recordGhostSample,
  saveGhostRun,
  SECTOR_TS,
  startGhostRecording,
  stopGhostRecording,
} from "@/game/systems/ghost";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";
import { useSceneStore } from "@/stores/scene-store";

export const FINISH_T = 0.985;

/**
 * Sprint timing on the open coastal road: records the A→B time, sector splits
 * and a ghost of your best run, and finishes the run at the end of the road.
 */
export function LapSystem() {
  const runId = useRaceStore((s) => s.runId);
  const recordingStarted = useRef(false);
  const sectorsDone = useRef(0);

  // Fresh run → arm a new ghost recording.
  useEffect(() => {
    recordingStarted.current = false;
    sectorsDone.current = 0;
    stopGhostRecording();
  }, [runId]);

  useFrame(() => {
    if (!vehicleTarget.active) return;
    const race = useRaceStore.getState();
    if (!race.started || race.paused || race.finished) return;

    const lap = useLapStore.getState();
    if (!lap.timing) return;

    if (!recordingStarted.current) {
      startGhostRecording();
      recordingStarted.current = true;
    }

    const pos = vehicleTarget.position;
    const t = getRoadProgress(pos.x, pos.z);
    const elapsed = performance.now() - lap.lapStartPerf;

    const idx = useSceneStore.getState().skyIndex;
    const trackId = SKY_PRESETS[idx % SKY_PRESETS.length]?.id ?? "unknown";

    // Ghost sampling (rate-limited inside).
    recordGhostSample(elapsed, pos.x, pos.z, vehicleTarget.rotationY);

    // Sector splits — fire once each, in order.
    if (
      sectorsDone.current < SECTOR_TS.length &&
      t >= SECTOR_TS[sectorsDone.current]!
    ) {
      lap.recordSplit(sectorsDone.current, elapsed, trackId);
      sectorsDone.current++;
    }

    if (t >= FINISH_T) {
      stopGhostRecording();
      const prevBest = lap.bestByTrack[trackId];
      const isBest = prevBest == null || elapsed < prevBest;
      if (isBest) saveGhostRun(trackId, elapsed);

      useLapStore.getState().completeLap(performance.now(), trackId);
      useRaceStore.getState().setFinished(true);
      playFinishFanfare();
    }
  });

  return null;
}
