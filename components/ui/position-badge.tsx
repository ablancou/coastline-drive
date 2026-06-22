"use client";

import { useRaceStore } from "@/stores/race-store";

/** Live race standing (P x / N). Hidden until the race starts. */
export function PositionBadge() {
  const started = useRaceStore((s) => s.started);
  const position = useRaceStore((s) => s.position);
  const total = useRaceStore((s) => s.totalRacers);

  if (!started || total <= 1) return null;

  return (
    <div className="pos-badge">
      <span className="pos-badge__p">P{position}</span>
      <span className="pos-badge__total">/ {total}</span>
    </div>
  );
}
