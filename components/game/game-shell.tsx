"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Garage } from "@/components/game/garage";
import { Landing } from "@/components/game/landing";
import { Minimap } from "@/components/game/minimap";
import { SkySwitcher } from "@/components/game/sky-switcher";
import { Hud } from "@/components/ui/hud";
import { pauseEngineAudio, startEngineAudio } from "@/game/procedural/audio/engine-audio";

const GameCanvas = dynamic(
  () => import("@/components/game/game-canvas").then((m) => m.GameCanvas),
  { ssr: false },
);

type Phase = "landing" | "garage" | "playing";

/** Client shell — landing → garage (configure) → playing. */
export function GameShell() {
  const [phase, setPhase] = useState<Phase>("landing");

  const handleStart = () => {
    startEngineAudio();
    setPhase("playing");
  };

  const handleExit = () => {
    pauseEngineAudio();
    setPhase("garage");
  };

  return (
    <main className="app">
      <div className="app__canvas">
        <GameCanvas />
      </div>
      <Hud />
      <SkySwitcher />

      {phase === "landing" && <Landing onEnter={() => setPhase("garage")} />}
      {phase === "garage" && (
        <Garage onStart={handleStart} onBack={() => setPhase("landing")} />
      )}
      {phase === "playing" && (
        <>
          <Minimap />
          <button className="exit-btn" onClick={handleExit} aria-label="Exit to garage">
            ✕ EXIT
          </button>
        </>
      )}
    </main>
  );
}
