"use client";

import { BestLapBanner } from "@/components/ui/best-lap-banner";
import { LapTimer } from "@/components/ui/lap-timer";
import { PositionBadge } from "@/components/ui/position-badge";
import { finiteOr } from "@/lib/math";
import { useTelemetryStore } from "@/stores/telemetry-store";

/** DOM overlay — reads Zustand telemetry only; no simulation imports. */
export function Hud() {
  const { snapshot } = useTelemetryStore();

  return (
    <div className="hud">
      <header className="hud__brand">
        <span className="hud__title">COASTLINE</span>
        <span className="hud__subtitle">DRIVE</span>
      </header>

      <LapTimer />
      <PositionBadge />
      <BestLapBanner />

      <div className="hud__speed">
        <span className="hud__speed-value">{formatInt(snapshot.speedKmh, 0)}</span>
        <span className="hud__speed-unit">km/h</span>
      </div>

      <div className="hud__telemetry">
        <TelemetryRow label="RPM" value={formatInt(snapshot.rpm, 0)} />
        <TelemetryRow label="GEAR" value={formatInt(snapshot.gear, 1)} />
        <TelemetryRow label="INPUT" value={snapshot.inputSource.toUpperCase()} />
        <TelemetryRow
          label="THR / BRK"
          value={`${pct(snapshot.throttle)} / ${pct(snapshot.brake)}`}
        />
        <TelemetryRow label="STEER" value={pct(Math.abs(snapshot.steer))} />
        {snapshot.handbrake ? (
          <span className="hud__handbrake">HANDBRAKE</span>
        ) : null}
      </div>

      <footer className="hud__controls">
        <span>W/RT throttle · S/LT brake · A/D steer · Space handbrake</span>
      </footer>
    </div>
  );
}

function TelemetryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="hud__row">
      <span className="hud__label">{label}</span>
      <span className="hud__value">{value}</span>
    </div>
  );
}

function formatInt(value: number, fallback: number): string {
  const safe = finiteOr(value, fallback);
  return String(Math.round(safe));
}

function pct(value: number): string {
  return `${formatInt(finiteOr(value, 0) * 100, 0)}%`;
}