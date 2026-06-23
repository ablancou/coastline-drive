"use client";

import { useRef } from "react";
import { touchInput } from "@/game/systems/touch-input";

/**
 * On-screen driving controls for touch devices. Writes to the shared touchInput
 * channel which the input system reads. Hidden on non-touch devices via CSS.
 */
export function TouchControls() {
  const down = useRef({ l: false, r: false, t: false, b: false, h: false, n: false });

  const sync = () => {
    const d = down.current;
    touchInput.steer = (d.r ? 1 : 0) - (d.l ? 1 : 0);
    touchInput.throttle = d.t ? 1 : 0;
    touchInput.brake = d.b ? 1 : 0;
    touchInput.handbrake = d.h;
    touchInput.boost = d.n;
    touchInput.active = d.l || d.r || d.t || d.b || d.h || d.n;
  };

  type Key = "l" | "r" | "t" | "b" | "h" | "n";
  const press = (key: Key, value: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    down.current[key] = value;
    sync();
  };

  const btn = (key: Key, cls: string, label: string) => (
    <button
      type="button"
      className={`touch-btn ${cls}`}
      aria-label={label}
      onPointerDown={press(key, true)}
      onPointerUp={press(key, false)}
      onPointerLeave={press(key, false)}
      onPointerCancel={press(key, false)}
    >
      {label}
    </button>
  );

  return (
    <div className="touch">
      <div className="touch__steer">
        {btn("l", "touch-btn--steer", "◀")}
        {btn("r", "touch-btn--steer", "▶")}
      </div>
      <div className="touch__drive">
        {btn("h", "touch-btn--handbrake", "P")}
        {btn("n", "touch-btn--boost", "N2O")}
        {btn("b", "touch-btn--brake", "▼")}
        {btn("t", "touch-btn--throttle", "▲")}
      </div>
    </div>
  );
}
