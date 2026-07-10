import { Quaternion, Vector3 } from "three";

/** Mutable vehicle pose — written from useFrame, read by chase camera. */
export interface VehicleTargetState {
  position: Vector3;
  quaternion: Quaternion;
  velocity: Vector3;
  active: boolean;
  /** Transient camera-shake intensity (set on impact, decayed by the camera). */
  shake: number;
  /** Slip angle (radians) between heading and travel — drives drift effects. */
  slip: number;
  /** Handbrake held this frame — drives extra tire smoke. */
  handbrake: boolean;
  /** Nitro actively firing this frame — drives whoosh audio + exhaust flames. */
  boost: boolean;
  /** Smoothed steer angle (radians) — the chase camera looks into corners. */
  steer: number;
  /** 0..1 — grinding against the road edge this step (drives sand dust). */
  edge: number;
}

export const vehicleTarget: VehicleTargetState = {
  position: new Vector3(),
  quaternion: new Quaternion(),
  velocity: new Vector3(),
  active: false,
  shake: 0,
  slip: 0,
  handbrake: false,
  boost: false,
  steer: 0,
  edge: 0,
};

export function updateVehicleTarget(
  translation: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number; w: number },
  linvel: { x: number; y: number; z: number },
): void {
  vehicleTarget.position.set(translation.x, translation.y, translation.z);
  vehicleTarget.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  vehicleTarget.velocity.set(linvel.x, linvel.y, linvel.z);
  vehicleTarget.active = true;
}