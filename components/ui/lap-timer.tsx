"use client";

import { useEffect, useState } from "react";
import { useLapStore } from "@/stores/lap-store";

/** How long a sector delta stays on screen after a split. */
const SPLIT_HOLD_MS = 3200;

/** HUD sprint timer — live run time, best A→B time, and sector deltas. */
export function LapTimer() {
  const { lapStartPerf, timing, bestLapMs, lastLapMs, splitDelta, splitShownAt } =
    useLapStore();
  const [now, setNow] = useState(0);

  // Self-tick for the live timer (display only — not on the physics hot path).
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Count up while running; freeze on the final time once the run is over.
  const currentMs = timing ? Math.max(0, now - lapStartPerf) : (lastLapMs ?? 0);

  const showSplit =
    splitDelta != null && now - splitShownAt < SPLIT_HOLD_MS && timing;
  const ahead = (splitDelta ?? 0) < 0;

  return (
    <div className="lap">
      <div className="lap__current">
        <span className="lap__eyebrow">RECORRIDO</span>
        <span className="lap__time">{formatLap(currentMs)}</span>
      </div>
      {showSplit && (
        <span className={`lap__split${ahead ? " lap__split--ahead" : " lap__split--behind"}`}>
          {formatDelta(splitDelta!)}
        </span>
      )}
      <div className="lap__rows">
        <div className="lap__row">
          <span className="lap__label">MEJOR</span>
          <span className="lap__value lap__value--best">{formatLap(bestLapMs)}</span>
        </div>
      </div>
    </div>
  );
}

function formatLap(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "--:--.---";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mmm = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(mmm).padStart(3, "0")}`;
}

function formatDelta(ms: number): string {
  const sign = ms < 0 ? "−" : "+";
  const abs = Math.abs(ms);
  return `${sign}${(abs / 1000).toFixed(2)}`;
}
