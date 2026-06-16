import type { RapierRigidBody } from "@react-three/rapier";
import { Vector3 } from "three";
import { getChassisRestHeightAboveRoad } from "@/game/constants/spawn";
import { getRoadSurfaceAt } from "@/game/procedural/geometry/road-path";

const surface = {
  y: 0,
  tangent: new Vector3(),
  point: new Vector3(),
  side: new Vector3(),
};

/**
 * Hard snap after physics — keeps chassis on the road spline (sim-cade safety net).
 * Runs in useAfterPhysicsStep so it corrects gravity integration.
 */
export function applyGroundConstraint(chassis: RapierRigidBody): boolean {
  const pos = chassis.translation();
  const vel = chassis.linvel();

  if (
    !Number.isFinite(pos.x) ||
    !Number.isFinite(pos.y) ||
    !Number.isFinite(pos.z)
  ) {
    return false;
  }

  getRoadSurfaceAt(pos.x, pos.z, surface);
  const minY = surface.y + getChassisRestHeightAboveRoad();

  if (!Number.isFinite(minY)) {
    return false;
  }

  const targetY = minY;
  const yError = Math.abs(pos.y - targetY);
  let corrected = false;

  if (yError > 0.001) {
    chassis.setTranslation({ x: pos.x, y: targetY, z: pos.z }, true);
    corrected = true;
  }

  if (!Number.isFinite(vel.y) || vel.y !== 0) {
    chassis.setLinvel(
      {
        x: Number.isFinite(vel.x) ? vel.x : 0,
        y: 0,
        z: Number.isFinite(vel.z) ? vel.z : 0,
      },
      true,
    );
    corrected = true;
  }

  return corrected;
}