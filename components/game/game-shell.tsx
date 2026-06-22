"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Countdown } from "@/components/game/countdown";
import { Garage } from "@/components/game/garage";
import { Landing } from "@/components/game/landing";
import { Minimap } from "@/components/game/minimap";
import { SkySwitcher } from "@/components/game/sky-switcher";
import { Hud } from "@/components/ui/hud";
import { pauseEngineAudio, startEngineAudio } from "@/game/procedural/audio/engine-audio";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";
import { useSceneStore } from "@/stores/scene-store";

const GameCanvas = dynamic(
  () => import("@/components/game/game-canvas").then((m) => m.GameCanvas),
  { ssr: false },
);

type Phase = "landing" | "garage" | "playing";

function formatLap(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mmm = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(mmm).padStart(3, "0")}`;
}

/** Client shell — landing → garage (configure) → playing (race + pause). */
export function GameShell() {
  const [phase, setPhase] = useState<Phase>("landing");
  const pausedAt = useRef(0);

  const paused = useRaceStore((s) => s.paused);
  const finished = useRaceStore((s) => s.finished);
  const started = useRaceStore((s) => s.started);
  const position = useRaceStore((s) => s.position);
  const totalRacers = useRaceStore((s) => s.totalRacers);
  const hudHidden = useSceneStore((s) => s.hudHidden);
  const lastLapMs = useLapStore((s) => s.lastLapMs);
  const bestLapMs = useLapStore((s) => s.bestLapMs);
  const raceTotalMs = useLapStore((s) => s.raceTotalMs);
  const lapCount = useLapStore((s) => s.lapCount);

  const beginRun = useCallback(() => {
    useLapStore.getState().reset();
    useRaceStore.getState().resetRun();
    startEngineAudio();
    setPhase("playing");
  }, []);

  const exitToGarage = useCallback(() => {
    pauseEngineAudio();
    useRaceStore.getState().resetRun();
    setPhase("garage");
  }, []);

  const togglePause = useCallback(() => {
    const race = useRaceStore.getState();
    if (race.finished || !race.started) return;
    if (!race.paused) {
      pausedAt.current = performance.now();
      pauseEngineAudio();
      race.setPaused(true);
    } else {
      // Resume: shift the lap clock forward by the paused duration.
      const delta = performance.now() - pausedAt.current;
      const lap = useLapStore.getState();
      useLapStore.setState({ lapStartPerf: lap.lapStartPerf + delta });
      startEngineAudio();
      race.setPaused(false);
    }
  }, []);

  // ESC toggles pause while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") togglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, togglePause]);

  return (
    <main className="app">
      <div className="app__canvas">
        <GameCanvas />
      </div>
      {!hudHidden && <Hud />}
      <SkySwitcher />

      {phase === "landing" && <Landing onEnter={() => setPhase("garage")} />}
      {phase === "garage" && (
        <Garage onStart={beginRun} onBack={() => setPhase("landing")} />
      )}

      {phase === "playing" && (
        <>
          {!hudHidden && <Minimap />}
          {!started && !finished && <Countdown />}
          {started && !paused && !finished && !hudHidden && (
            <button className="exit-btn" onClick={togglePause} aria-label="Pause">
              ❚❚ PAUSA
            </button>
          )}

          {paused && !finished && (
            <div className="overlay">
              <div className="overlay__panel">
                <h2 className="overlay__title">PAUSA</h2>
                <button className="start__cta" onClick={togglePause}>
                  REANUDAR
                </button>
                <button className="overlay__link" onClick={exitToGarage}>
                  ← Garage
                </button>
              </div>
            </div>
          )}

          {finished && (
            <div className="overlay">
              <div className="overlay__panel">
                <h2 className="overlay__title overlay__title--win">¡CARRERA TERMINADA!</h2>
                <div className="overlay__stats">
                  {totalRacers > 1 && (
                    <div className="overlay__stat">
                      <span>POSICIÓN</span>
                      <b className="overlay__best">
                        P{position} / {totalRacers}
                      </b>
                    </div>
                  )}
                  <div className="overlay__stat">
                    <span>VUELTAS</span>
                    <b>{lapCount}</b>
                  </div>
                  <div className="overlay__stat">
                    <span>TIEMPO TOTAL</span>
                    <b>{formatLap(raceTotalMs)}</b>
                  </div>
                  <div className="overlay__stat">
                    <span>MEJOR VUELTA</span>
                    <b className="overlay__best">{formatLap(bestLapMs)}</b>
                  </div>
                  <div className="overlay__stat">
                    <span>ÚLTIMA</span>
                    <b>{formatLap(lastLapMs)}</b>
                  </div>
                </div>
                <button className="start__cta" onClick={beginRun}>
                  REINICIAR
                </button>
                <button className="overlay__link" onClick={exitToGarage}>
                  ← Garage
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
