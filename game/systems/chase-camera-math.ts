import { Quaternion, Vector3 } from "three";
import { CHASE_CAMERA } from "@/game/constants/camera";

const FORWARD = new Vector3(0, 0, 1);

export interface ChaseCameraPose {
  position: Vector3;
  lookAt: Vector3;
}

const _forward = new Vector3();

/**
 * Third-person pose: behind the car (+world Y lift), looking slightly ahead.
 * Vehicle local +Z is forward (matches procedural mesh orientation).
 */
export function computeChaseCameraPose(
  position: Vector3,
  quaternion: Quaternion,
  speedMs = 0,
  out: ChaseCameraPose = { position: new Vector3(), lookAt: new Vector3() },
): ChaseCameraPose {
  const cfg = CHASE_CAMERA;

  _forward.copy(FORWARD).applyQuaternion(quaternion).normalize();

  const speedPullback = Math.min(speedMs * 0.035, 2.5);

  out.position.copy(position);
  out.position.addScaledVector(_forward, -(cfg.distance + speedPullback));
  out.position.y += cfg.height;

  out.lookAt.copy(position);
  out.lookAt.addScaledVector(_forward, cfg.lookAhead);
  out.lookAt.y = position.y + cfg.lookHeight;

  return out;
}