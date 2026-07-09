"use client";

import { BestLapBanner } from "@/components/ui/best-lap-banner";
import { LapTimer } from "@/components/ui/lap-timer";
import { PositionBadge } from "@/components/ui/position-badge";
import { finiteOr } from "@/lib/math";
import { useTelemetryStore } from "@/stores/telemetry-store";

const IDLE_RPM = 800;
const MAX_RPM = 7200;

// Circular tach geometry: a 270° sweep with the gap at the bottom.
const R = 52;
const C = 2 * Math.PI * R;
const SWEEP = 0.75; // 270° of the full circle
const ARC = C * SWEEP;

/** DOM overlay — reads Zustand telemetry only; no simulation imports. */
export function Hud() {
  const { snapshot } = useTelemetryStore();

  const speed = Math.round(finiteOr(snapshot.speedKmh, 0));
  const rpm = finiteOr(snapshot.rpm, IDLE_RPM);
  const rpmFrac = Math.min(1, Math.max(0, rpm / MAX_RPM));
  const nitro = Math.min(1, Math.max(0, finiteOr(snapshot.nitro, 1)));
  const gear = Math.max(1, Math.round(finiteOr(snapshot.gear, 1)));

  // Tach color climbs from cyan → amber → red as it approaches the redline.
  const tachColor =
    rpmFrac > 0.88 ? "#ff3b3b" : rpmFrac > 0.7 ? "#ffb02e" : "#39d6ff";

  return (
    <div className="hud">
      <header className="hud__brand">
        <span className="hud__title">COASTLINE</span>
        <span className="hud__subtitle">DRIVE</span>
      </header>

      <LapTimer />
      <PositionBadge />
      <BestLapBanner />

      {/* Speed + tach cluster */}
      <div className="gauge" aria-hidden="true">
        <svg className="gauge__svg" viewBox="0 0 120 120">
          <circle
            className="gauge__track"
            cx="60"
            cy="60"
            r={R}
            strokeDasharray={`${ARC} ${C}`}
            transform="rotate(135 60 60)"
          />
          <circle
            className="gauge__fill"
            cx="60"
            cy="60"
            r={R}
            stroke={tachColor}
            strokeDasharray={`${rpmFrac * ARC} ${C}`}
            transform="rotate(135 60 60)"
            style={{ filter: `drop-shadow(0 0 5px ${tachColor}aa)` }}
          />
          {/* Redline arc marker (last ~12%). */}
          <circle
            className="gauge__redline"
            cx="60"
            cy="60"
            r={R}
            strokeDasharray={`${0.12 * ARC} ${C}`}
            strokeDashoffset={`${-0.88 * ARC}`}
            transform="rotate(135 60 60)"
          />
        </svg>
        <div className="gauge__center">
          <span className="gauge__speed">{speed}</span>
          <span className="gauge__unit">km/h</span>
        </div>
        <div className="gauge__gear">
          <span className="gauge__gear-label">GEAR</span>
          <span className="gauge__gear-value">{gear}</span>
        </div>
      </div>

      <div className="hud__nitro" aria-hidden="true">
        <span className="hud__nitro-label">NITRO</span>
        <div className="hud__nitro-bar">
          <div
            className={`hud__nitro-fill${nitro > 0.66 ? " hud__nitro-fill--full" : ""}`}
            style={{ width: `${Math.round(nitro * 100)}%` }}
          />
        </div>
      </div>

      {snapshot.handbrake ? <span className="hud__handbrake">DERRAPE</span> : null}

      <footer className="hud__controls">
        <span>W/S acelerar · A/D girar · Shift nitro · Espacio derrape</span>
      </footer>
    </div>
  );
}
