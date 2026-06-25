"use client";

import { useEffect, useRef, useState } from "react";
import { useLapStore } from "@/stores/lap-store";

/** Flashes a celebratory banner when the player sets a new best lap. */
export function BestLapBanner() {
  const lapCount = useLapStore((s) => s.lapCount);
  const lastLapMs = useLapStore((s) => s.lastLapMs);
  const bestLapMs = useLapStore((s) => s.bestLapMs);
  const prevCount = useRef(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (lapCount > prevCount.current) {
      prevCount.current = lapCount;
      // A completed lap that equals the best time is a new record.
      if (lastLapMs != null && bestLapMs != null && lastLapMs <= bestLapMs) {
        setShow(false);
        // Re-trigger the animation on consecutive records.
        requestAnimationFrame(() => setShow(true));
        const t = setTimeout(() => setShow(false), 2600);
        return () => clearTimeout(t);
      }
    }
  }, [lapCount, lastLapMs, bestLapMs]);

  if (!show) return null;

  return (
    <div className="best-banner" role="status">
      <span className="best-banner__title">¡RÉCORD!</span>
      <span className="best-banner__time">{formatLap(bestLapMs)}</span>
    </div>
  );
}

function formatLap(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mmm = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(mmm).padStart(3, "0")}`;
}
