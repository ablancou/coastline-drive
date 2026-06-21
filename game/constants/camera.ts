/** Base (resting) field of view; widens with speed for a sense of velocity. */
export const CAMERA_BASE_FOV = 55;

/** Third-person chase camera tuning. */
export const CHASE_CAMERA = {
  /** Distance behind the vehicle along its forward axis. */
  distance: 9.5,
  /** Fixed world-Y lift above the chassis (prevents ground-diving pitch). */
  height: 4.0,
  /** Look-ahead distance along vehicle forward. */
  lookAhead: 5.0,
  /** Look-at height above chassis center. */
  lookHeight: 1.35,
  /** Exponential damping — higher = snappier. */
  positionDamping: 5.5,
  lookDamping: 8.0,
} as const;