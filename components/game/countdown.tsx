"use client";

import { useEffect, useState } from "react";
import { playBark, playCountdownBeep } from "@/game/procedural/audio/engine-audio";
import { useCustomizationStore } from "@/stores/customization-store";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";

/** 3-2-1-GO start sequence. Releases the car (race.started) on GO. */
export function Countdown() {
  const [n, setN] = useState(3);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const step = (value: number, delay: number) =>
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setN(value);
          playCountdownBeep(value === 0);
          // The pack barks with excitement on GO.
          if (value === 0 && useCustomizationStore.getState().dogCount > 0) {
            playBark();
            if (useCustomizationStore.getState().dogCount > 2) {
              setTimeout(() => !cancelled && playBark(), 180);
            }
          }
        }, delay),
      );

    step(3, 0);
    step(2, 800);
    step(1, 1600);
    step(0, 2400); // "GO"
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        useLapStore.getState().startTiming(performance.now());
        useRaceStore.getState().setStarted(true);
      }, 3000),
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="countdown" aria-hidden="true">
      <span className={`countdown__num${n === 0 ? " countdown__num--go" : ""}`}>
        {n > 0 ? n : "¡GO!"}
      </span>
    </div>
  );
}
