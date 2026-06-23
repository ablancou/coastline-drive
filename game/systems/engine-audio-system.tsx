"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import {
  isEngineAudioRunning,
  toggleEngineAudioMuted,
  updateEngineAudio,
  updateMusic,
} from "@/game/procedural/audio/engine-audio";
import { vehicleTarget } from "@/game/systems/vehicle-target";
import { useTelemetryStore } from "@/stores/telemetry-store";

/**
 * Bridges throttled telemetry → procedural engine audio. Lives inside the
 * Canvas; produces no sound until the user starts the game (autoplay gesture).
 * Press "M" to mute/unmute.
 */
export function EngineAudioSystem() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyM") toggleEngineAudioMuted();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFrame(() => {
    if (!isEngineAudioRunning()) return;
    updateMusic();
    const s = useTelemetryStore.getState().snapshot;
    updateEngineAudio(
      s.rpm,
      s.speedKmh,
      s.throttle,
      s.handbrake,
      Math.abs(s.steer),
      Math.abs(vehicleTarget.slip),
    );
  });

  return null;
}
