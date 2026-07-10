import { Quaternion, Vector3 } from "three";
import { CHASE_CAMERA } from "@/game/constants/camera";

const FORWARD = new Vector3(0, 0, 1);

export interface ChaseCameraPose {
  position: Vector3;
  lookAt: Vector3;
}

const _forward = new Vector3();
const _side = new Vector3();

/**
 * Third-person pose: behind the car (+world Y lift), looking slightly ahead —
 * and INTO the corner while steering (the look-at point shifts laterally with
 * the steer angle, like a driver's eyes), which makes bends readable earlier.
 * Vehicle local +Z is forward (matches procedural mesh orientation).
 */
export function computeChaseCameraPose(
  position: Vector3,
  quaternion: Quaternion,
  speedMs = 0,
  steer = 0,
  out: ChaseCameraPose = { position: new Vector3(), lookAt: new Vector3() },
): ChaseCameraPose {
  const cfg = CHASE_CAMERA;

  _forward.copy(FORWARD).applyQuaternion(quaternion).normalize();
  // Screen-right relative to the car (forward × up = (−fz, 0, fx)).
  _side.set(-_forward.z, 0, _forward.x);

  const speedPullback = Math.min(speedMs * 0.035, 2.5);

  out.position.copy(position);
  out.position.addScaledVector(_forward, -(cfg.distance + speedPullback));
  out.position.y += cfg.height;

  out.lookAt.copy(position);
  out.lookAt.addScaledVector(_forward, cfg.lookAhead);
  // Look into the turn — scaled by speed so it stays calm at a crawl.
  const speedFactor = Math.min(1, speedMs / 14);
  out.lookAt.addScaledVector(_side, steer * 5.5 * speedFactor);
  out.lookAt.y = position.y + cfg.lookHeight;

  return out;
}