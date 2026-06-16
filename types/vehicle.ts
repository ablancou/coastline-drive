import type { Vector3Tuple } from "three";

/** Local-space wheel attachment relative to chassis center. */
export interface WheelMount {
  id: string;
  position: Vector3Tuple;
  radius: number;
  isDrive: boolean;
  isSteer: boolean;
}

/** Mutable simulation state — lives in useRef, never in React state. */
export interface VehicleSimState {
  engineRpm: number;
  steerAngle: number;
  wheelSpin: number[];
  /** Signed ground speed: positive forward, negative in reverse. */
  speedMs: number;
  /** World-space yaw (radians) the car points toward. */
  heading: number;
  /** World-space direction of actual travel — lags heading when drifting. */
  velAngle: number;
  /** Visual chassis pitch (squat/dive) in radians — render only. */
  bodyPitch: number;
  /** Visual chassis roll (body lean in corners) in radians — render only. */
  bodyRoll: number;
  /** Per-wheel spring length from raycast (hub → tire contact). */
  suspensionLengths: number[];
  /** Whether each wheel ray hit a collider this step. */
  wheelGrounded: boolean[];
}