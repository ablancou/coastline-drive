"use client";

import { startEngineAudio } from "@/game/procedural/audio/engine-audio";

interface StartScreenProps {
  onStart: () => void;
}

/**
 * Title / start overlay. The "DRIVE" click is the user gesture that unlocks the
 * Web Audio engine (browser autoplay policy) and reveals the running scene.
 */
export function StartScreen({ onStart }: StartScreenProps) {
  const handleStart = () => {
    startEngineAudio();
    onStart();
  };

  return (
    <div className="start" role="dialog" aria-label="Coastline Drive — start">
      <div className="start__inner">
        <span className="start__tag">PROTOTYPE · WORK IN PROGRESS</span>
        <h1 className="start__title">COASTLINE</h1>
        <h2 className="start__subtitle">DRIVE</h2>
        <p className="start__tagline">
          A procedural coastal-highway racer — built in code, no external assets.
        </p>

        <button className="start__cta" onClick={handleStart} autoFocus>
          START
        </button>

        <div className="start__controls">
          <span><b>W</b> / <b>RT</b> throttle</span>
          <span><b>S</b> / <b>LT</b> brake · reverse</span>
          <span><b>A</b> <b>D</b> steer</span>
          <span><b>Space</b> handbrake / drift</span>
          <span><b>N</b> cambiar playa</span>
          <span><b>M</b> mute</span>
        </div>
      </div>
    </div>
  );
}
