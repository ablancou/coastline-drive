"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SkySwitcher } from "@/components/game/sky-switcher";
import { StartScreen } from "@/components/game/start-screen";
import { Hud } from "@/components/ui/hud";
import { pauseEngineAudio } from "@/game/procedural/audio/engine-audio";

const GameCanvas = dynamic(
  () => import("@/components/game/game-canvas").then((m) => m.GameCanvas),
  { ssr: false },
);

/** Client shell — Canvas requires browser WebGL; HUD overlays via Zustand. */
export function GameShell() {
  const [started, setStarted] = useState(false);

  const handleExit = () => {
    pauseEngineAudio();
    setStarted(false);
  };

  return (
    <main className="app">
      <div className="app__canvas">
        <GameCanvas />
      </div>
      <Hud />
      <SkySwitcher />
      {started ? (
        <button className="exit-btn" onClick={handleExit} aria-label="Exit to menu">
          ✕ EXIT
        </button>
      ) : (
        <StartScreen onStart={() => setStarted(true)} />
      )}
    </main>
  );
}
