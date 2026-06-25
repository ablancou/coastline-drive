"use client";

import { useEffect, useState } from "react";
import { useLapStore } from "@/stores/lap-store";

/** HUD sprint timer — live run time + best A→B time. DOM only. */
export function LapTimer() {
  const { lapStartPerf, timing, bestLapMs } = useLapStore();
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

  const currentMs = timing ? Math.max(0, now - lapStartPerf) : 0;

  return (
    <div className="lap">
      <div className="lap__current">
        <span className="lap__eyebrow">RECORRIDO</span>
        <span className="lap__time">{formatLap(currentMs)}</span>
      </div>
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
