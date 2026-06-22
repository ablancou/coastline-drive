"use client";

import { useEffect, useState } from "react";
import { useLapStore } from "@/stores/lap-store";
import { useRaceStore } from "@/stores/race-store";

/** 3-2-1-GO start sequence. Releases the car (race.started) on GO. */
export function Countdown() {
  const [n, setN] = useState(3);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const step = (value: number, delay: number) =>
      timers.push(setTimeout(() => !cancelled && setN(value), delay));

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
