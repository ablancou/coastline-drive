import { Quaternion, Vector3 } from "three";

/** Mutable vehicle pose — written from useFrame, read by chase camera. */
export interface VehicleTargetState {
  position: Vector3;
  quaternion: Quaternion;
  velocity: Vector3;
  active: boolean;
}

export const vehicleTarget: VehicleTargetState = {
  position: new Vector3(),
  quaternion: new Quaternion(),
  velocity: new Vector3(),
  active: false,
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