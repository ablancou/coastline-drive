/** Circular dead zone for analog sticks — avoids per-frame allocation. */
export function applyDeadzone(value: number, deadzone: number): number {
  const abs = Math.abs(value);
  if (abs < deadzone) return 0;
  const scaled = (abs - deadzone) / (1 - deadzone);
  return Math.sign(value) * Math.min(scaled, 1);
}

/** Clamp helper used in physics hot path. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Fallback when Rapier or force integration produces non-finite values. */
export function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

/** Wrap an angle (radians) into the [-π, π] range — for shortest-arc lerps. */
export function wrapAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  else if (a < -Math.PI) a += Math.PI * 2;
  return a;
}